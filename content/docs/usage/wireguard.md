---
title: "Wireguard"
weight: 56
description: >
  kube-vip usage on wireguard.
---

## Pre-requisistes

- This will require kube-vip starting as a daemonset as it will need to read existing data (`secrets`) from inside the cluster.
- A WireGuard server that will act as the ingress for the control plane and/or several services
- Distinct network ranges for WireGuard tunnel

## Limitations
- no IPv6 support (untested)
- TCP and UDP support only
- control plane port is hardcoded 6443 (resulting URL is https://<vip>:6443)

## Architecture
The VPN node is the pre-existing WireGuard server, implementation and setup for that is out of scope for kube-vip. External traffic, for example from the internet, reaches the VPN node and gets forwarded to the peer currently connected. That peer (in our case Node A) forwards that traffic to the respective service or the control plane. If a node should lose its lease, another node will connect to the VPN Node and the VPN Node will forward traffic to that peer.    
kube-vip also supports several tunnels at once, providing access from multiple sources.

```
           ┌────────────────────┐        
           │                    │        
           │  External Traffic  │        
           │                    │        
           └────────┬───────────┘        
                    │                    
                    │                    
             ┌──────▼───────┐            
             │              │            
      ┌──────►   VPN Node   │            
      │      │              │            
      │      └──────────────┘            
      │                                  
      │                                  
┌─────▼─────┐  ┌──────────┐  ┌──────────┐
│           │  │          │  │          │
│  Node A   │  │  Node B  │  │  Node C  │
│           │  │          │  │          │
└───────────┘  └──────────┘  └──────────┘
```

## Configuration
kube-vip usually runs within the host's network namespace. However, it is strongly recommended that this is disabled when using the WireGuard mode. The reason for this is, that the crash of a kube-vip pod may result in a WireGuard connection still being open. Other nodes then will not be able to connect to the VPN Node.    
Disabling the host network access also implies, that kube-vip cannot change networking sysctls (which are required for forwarding and routing) on its own. Thus, these have to be set in the pod's security context. Note however that these sysctls also need to be allowed in the kubelet configuration. More information can be found in Kubernetes' [documentation](https://kubernetes.io/docs/tasks/administer-cluster/sysctl-cluster/)

```yaml
podSecurityContext:
  sysctls:
    - name: net.ipv4.conf.all.src_valid_mark
      value: "1"
    - name: net.ipv4.conf.all.route_localnet
      value: "1"
hostNetwork: false
```

### Secrets

In order to configure the available tunnels and VIPs, a secret named `wireguard` must exist in the same namespace as kube-vip's namespace.
```yaml
apiVersion: v1
kind: Secret
metadata:
    name: wireguard
    namespace: <kube-vip namespace>
stringData:
    tunnels: |
        wg0:
            vip: <ip-address>/32
            privateKey: <this peers private key>
            peerPublicKey: <public key of VPN Node>
            peerEndpoint: <endpoint of VPN Node>
            listenPort: 51820
            allowedIPs:
                - 10.0.0.0/8
        wg1:
            vip: <ip-address>/32
            privateKey: <this peers private key>
            peerPublicKey: <public key of VPN Node>
            peerEndpoint: <endpoint of VPN Node>
            listenPort: 51821
            allowedIPs:
                - 100.0.0.0/8
```

Attention needs to be paid to the allowed IPs. First, the ranges from several tunnels cannot be overlapping. If that is a requirement, several deployments should be created. Also, the ranges should not include the pod CIDR or other potentially conflicting ranges. The allowed IPs however must include all IP ranges, where traffic is expected to come from. If you want to receive traffic from the internet, you need to calculate ranges which include everything reachable by the internet, but do not include your pod CIDR and other potential private networks. There are several calculators available online for that.
