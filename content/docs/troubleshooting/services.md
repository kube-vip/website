---
title: "Troubleshooting Services"
weight: 98
description: >
  kube-vip Troubleshooting
---

## Service stuck in `<pending>`

If a service is stuck in the `<pending>` state then there are a number of places to begin looking!

### Are all the components running?

In order for a succesfuly load balancer service to be created then ensure the following is running:

- A Cloud controller manager, such as the kube-vip-cloud-provider
- The kube-vip pods (either as a daemonset or as static pods)

### Is kube-vip running with services enabled?

Look at the logs of the kube-vip pods to determine if services are enabled:

```
kubectl logs -n test kube-vip-ds-9kbgv
time="2022-10-07T09:44:23Z" level=info msg="Starting kube-vip.io [v0.5.0]"
time="2022-10-07T09:44:23Z" level=info msg="namespace [kube-system], Mode: [ARP], Features(s): Control Plane:[false], Services:[true]"
```

The `Services:[true]` is what is required!

### Is an address being assigned?

The `<pending>` is only removed from a service **once** the status is updated, however to rule out the cloud controller we can examine the service to see if an IP was allocated.

```
kubectl get svc nginx -o yaml

apiVersion: v1
kind: Service
metadata:
  annotations:
    kube-vip.io/vipHost: k8s04
    "kube-vip.io/loadbalancerIPs": "1.1.1.1"
  labels:
    implementation: kube-vip
    ipam-address: 192.168.0.220
  name: nginx
  namespace: default
spec:
...
  loadBalancerIP: 192.168.0.220
```

The above example shows that the `annotations[kube-vip.io/loadbalancerIPs]` was populated with an IP from the cloud controller, this means that the problem is with the `kube-vip` pods themselves.

Since k8s 1.24, loadbalancerIP field [is deprecated](https://github.com/kubernetes/kubernetes/pull/107235). It's recommended to use the annotations instead of command line or `service.spec.loadBalancerIP` to specify the ip.

### Examining the `kube-vip` pods

Checking the logs of the kube-vip pods should hopefully reveal some reasons as to why they're unsuccssefully advertising the IP to the outside world and updating the `status` of the serivce.

### If `kubectl` doesn't work

Sometimes `kubectl` can't talk to the cluster, which makes it difficult to troubleshoot why the control plane node isn't working. This is likely due to the API server and etcd pods crashing, which results in kube-vip crashing.

If a new control plane node is unstable, there may be an issue with your Container Runtime Interface (CRI) cgroup configuration if using `containerd` on a `systemd` based distro.

#### Check the stability of your Control Plane Node's Pods

To check the stability of your control plane pods when `kubectl` is unusable, you can use `crictl`:

```
crictl ps -a
```

Or to watch the pods over a period of time:
```
watch -n 1 crictl ps -a
```

If you see the control plane pods (etcd, kube-apiserver, etc.) show a mix of "Exited" and "Running" and the "ATTEMPT" counters are going up every minute or so, it is likely the CRI is not configured correctly.
On a system using `containerd` (sometimes installed as a dependency of docker) for the CRI and `systemd` for the init system, the cgroup driver in `containerd` needs to be configured for systemd.
Without the systemd cgroup driver, it appears containers are frequently sent the SIGTERM signal.

#### Set containerd to use systemd cgroups

`containerd` needs the cgroup driver set to systemd when a systemd init system is present on your distro. To do this, you can execute the following 3 commands to generate the containerd config and set the option:
```
sudo mkdir /etc/containerd
sudo containerd config default | sed 's/SystemdCgroup = false/SystemdCgroup = true/' | sudo tee /etc/containerd/config.toml
sudo systemctl restart containerd.service
```

If you have already attempted to init a new control plane node with `kubeadm`, and it is the first node in a new cluster, you can then reset and init it again with the following commands:
```
sudo kubeadm reset -f
sudo kubeadm init .....
```
