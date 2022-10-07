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
  labels:
    implementation: kube-vip
    ipam-address: 192.168.0.220
  name: nginx
  namespace: default
spec:
...
  loadBalancerIP: 192.168.0.220
```

The above example shows that the `spec.loadBalancerIP` was populated with an IP from the cloud controller, this means that the problem is with the `kube-vip` pods themselves.

### Examining the `kube-vip` pods

Checking the logs of the kube-vip pods should hopefully reveal some reasons as to why they're unsuccssefully advertising the IP to the outside world and updating the `status` of the serivce.
