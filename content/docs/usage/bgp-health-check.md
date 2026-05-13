---
title: "BGP Control Plane Health Check"
weight: 52
description: >
  Automatic BGP route withdrawal when the local kube-apiserver becomes unhealthy
---

## The Problem

In BGP mode without leader election, every kube-vip instance on every control-plane node announces the same VIP. Typically, an upstream BGP router uses ECMP (Equal-Cost Multi-Path) to distribute API traffic evenly across all announcing nodes.

If a node's kube-apiserver goes down while kubelet (and therefore the kube-vip static pod) remains running, kube-vip continues to advertise the BGP route. The upstream router keeps sending a share of API traffic to the dead apiserver, creating a **black hole** for that fraction of requests. This condition persists until either kube-vip is stopped or the kube-apiserver becomes healthy again.

## The Solution

kube-vip can poll a configurable HTTP(S) endpoint to gate the BGP route announcement. When the endpoint becomes unreachable or returns a non-200 status for a configurable number of consecutive checks, kube-vip **withdraws the BGP route**, removing the unhealthy node from the ECMP set. Once the endpoint recovers, the route is **re-announced** automatically.

The recommended endpoint is the Kubernetes API server's built-in `/livez` health check:

```
https://localhost:6443/livez
```

## Configuration

The health check is **disabled by default**. Set `control_plane_health_check_address` to enable it.

### Environment Variables


| Variable                                       | Usage                                                                                                                                                                                        | Default |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `control_plane_health_check_address`           | URL to poll (e.g. `https://localhost:6443/livez`). Empty disables the health check.                                                                                                          | `""`    |
| `control_plane_health_check_period_seconds`    | Seconds between health check requests                                                                                                                                                        | `5`     |
| `control_plane_health_check_timeout_seconds`   | Timeout in seconds for each HTTP request                                                                                                                                                     | `3`     |
| `control_plane_health_check_failure_threshold` | Consecutive failures before the BGP route is withdrawn                                                                                                                                       | `3`     |
| `control_plane_health_check_ca_path`           | Path to a PEM CA certificate for HTTPS verification. When empty, the system trust store is used. If your kube-apiserver cert uses a private CA, you'll need to point this to that CA's cert. | `""`    |


### CLI Flags

The same options are available as CLI flags for manifest generation:


| Flag                                        | Usage                      | Default |
| ------------------------------------------- | -------------------------- | ------- |
| `--controlPlaneHealthCheckAddress`          | URL to poll                | `""`    |
| `--controlPlaneHealthCheckPeriodSeconds`    | Seconds between checks     | `5`     |
| `--controlPlaneHealthCheckTimeoutSeconds`   | Per-request timeout        | `3`     |
| `--controlPlaneHealthCheckFailureThreshold` | Failures before withdrawal | `3`     |
| `--controlPlaneHealthCheckCAPath`           | CA cert path for HTTPS     | `""`    |


## Behavior

1. **Startup** -- kube-vip begins polling the health check address immediately. The BGP route is **not announced until the first successful check**. This prevents advertising a node whose apiserver hasn't started yet.
2. **Healthy** -- each HTTP 200 response resets the consecutive failure counter. If the route was previously withdrawn, it is re-announced.
3. **Unhealthy** -- any non-200 response, connection error, or timeout increments the failure counter. When the counter reaches `control_plane_health_check_failure_threshold`, the BGP route is withdrawn.
4. **Recovery** -- the first successful check after a failure period resets the counter and re-announces the route.
5. **Shutdown** -- on SIGTERM (e.g. when the static pod is stopped), kube-vip withdraws the BGP route before exiting, ensuring clean removal from the ECMP set. This means planned maintenance (draining a node, upgrading kubelet) also benefits from graceful route withdrawal.

## Example: Static Pod Manifest

Below is a kube-vip static pod manifest for BGP mode with the health check enabled.

{{< tip "info" >}}
When using HTTPS with a self-signed or private CA (typical for kubeadm clusters), you **must** set `control_plane_health_check_ca_path` to the path of the CA certificate (usually `/etc/kubernetes/pki/ca.crt`) and mount it into the pod. Without it, the health check will fail TLS verification and never announce the route.
{{< /tip >}}

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: kube-vip
  namespace: kube-system
spec:
  containers:
  - name: kube-vip
    image: ghcr.io/kube-vip/kube-vip:v1.1.2
    args:
    - manager
    env:
    - name: cp_enable
      value: "true"
    - name: vip_address
      value: "192.168.1.100"
    - name: vip_interface
      value: "eth0"
    - name: bgp_enable
      value: "true"
    - name: bgp_as
      value: "65000"
    - name: bgp_peers
      value: "192.168.1.1:65001::false"
    - name: control_plane_health_check_address
      value: "https://localhost:6443/livez"
    - name: control_plane_health_check_ca_path
      value: "/etc/kubernetes/pki/ca.crt"
    securityContext:
      capabilities:
        add:
        - NET_ADMIN
        - NET_RAW
    volumeMounts:
    - mountPath: /etc/kubernetes/pki/ca.crt
      name: health-check-ca
      readOnly: true
  hostNetwork: true
  volumes:
  - hostPath:
      path: /etc/kubernetes/pki/ca.crt
      type: File
    name: health-check-ca
```

## When to Use

This feature is designed for environments where kube-vip runs in **BGP mode without leader election** (every node announces the VIP).

The health check is **not needed** when:

- Using **leader election** (ARP mode or BGP with `vip_leaderelection=true`), because only one node advertises the VIP at a time and the election mechanism handles failover.
- Using the **IPVS load balancer** (`lb_enable=true`), which already has its own node health tracking.

## Tuning

The default values (`period=5s`, `timeout=3s`, `threshold=3`) mean a failing apiserver is removed from the ECMP set within approximately **15-18 seconds** (3 failed checks at 5-second intervals, plus timeout).

For faster detection, reduce the period and threshold:

```yaml
- name: control_plane_health_check_period_seconds
  value: "1"
- name: control_plane_health_check_failure_threshold
  value: "3"
- name: control_plane_health_check_timeout_seconds
  value: "1"
```

This reduces detection time to approximately **3-4 seconds**, but increases load on the apiserver.

{{< tip "warning" >}}
Be careful when reducing the `control_plane_health_check_failure_threshold` too much. Transient issues connecting to the API server or brief CPU spikes can cause the health check to fail momentarily. If the threshold is too low, these transient issues can create flakes where the BGP route is prematurely withdrawn and re-announced, leading to unstable routing.
{{< /tip >}}