---
title: "ARP"
weight: 21
description: >
  kube-vip ARP mode
---

ARP (sometimes referred to as layer 2 as it's updating the underlying network topology) is a simplistic protocol that is used to update the underlying network that in order to reach a certain IP address traffic should be sent to a specific piece of hardware. ARP mode works by broadcasting ARP announcements when the virtual IP (VIP) transitions between nodes. These broadcasts update the ARP tables across the network, changing the IP-to-MAC address mapping from the previous node's interface to the current active node's interface. This ensures that subsequent traffic destined for the VIP is forwarded to the correct physical or virtual network interface.

### Control plane

When using ARP with the control plane feature, then a leader election will take place in order to determine the leader. This leader will then host the control place IP address and use ARP (through a gratuitous ARP broadcast) to update the network accordingly.

### Services

Services can be exposed in two ways:

- `leaderElection` for all services
- `leaderElection` per service

### `leaderElection` for all services

In this mode (default) all kube-vip pods will elect a leader and this leader will be in charge of exposing all service addresses through ARP. This mode can become a bottleneck as traffic for **all** services will come to a single node.

### `leaderElection` per service

In this mode kube-vip will perform an election every time a new Kubernetes service is created allowing service addresses to be spread across all nodes where a kube-vip pod is running.

### VIP Preservation on Leadership Loss

By default, when a node loses leadership (or cannot maintain it), kube-vip immediately removes the VIP address from the network interface. The `PreserveVIPOnLeadershipLoss` feature provides more graceful handling during leadership transitions by keeping the VIP on the interface until a new leader is elected, while immediately stopping ARP/NDP broadcasts to prevent network conflicts.

**Behavior when enabled:**
- On leadership loss, the VIP remains on the interface but ARP/NDP broadcasting stops immediately
- The VIP is only removed when a new leader is successfully elected
- The old node cleans up preserved VIPs once it detects the new leader

**Important Note:**
- IPv6 VIPs are always removed immediately (even with this feature enabled) to prevent Duplicate Address Detection (DAD) failures

### **Cautions**

1. With this mode, kube-vip assigns VIP on the network interface which may be **wrongly** chosen by kubelet as the node's InternalIP, which is not intended. So we recommend to ensure kubelet using the right IP by setting the `--node-ip` option for [kubelet](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet/) explicitly.

1. When you use [calico](https://github.com/projectcalico/calico) you should additionally configure the correct autodetection mode, as would discover the VIP IP as the node IP and tries to use it for the BGP Speaker (Felix Container). The recommendation would be to set the following two environment variables as described in the [docs](https://docs.tigera.io/calico/latest/reference/configure-calico-node#kubernetes-internal-ip)). This will always use the configured node IP from above.

    - ```yaml
      - name: IP_AUTODETECTION_METHOD
        value: kubernetes-internal-ip
        ```

    - ```yaml
      - name: IP6_AUTODETECTION_METHOD
        value: kubernetes-internal-ip
        ```
