---
title: "ARP"
weight: 21
description: >
  kube-vip ARP mode
---

ARP (sometimes called layer 2) is a simplistic protocol that is used to update the underlying network that in order to reach a certain IP address traffic should be sent to a specific piece of hardware. ARP will typically broadcast updates to the entire network that update the IP to Hardware (MAC) mapping, so that a host knows which physical or virtual network nic should be used to send traffic to.

### Control plane

When using ARP with the control plane feature, then a `leaderElection` will take place in order to determine the leader. This leader will then host the control place IP address and use ARP (through a gratuitous ARP broadcast) to update the network accordingly.

### Services

Services can be exposed in two ways: 

- `leaderElection` for all services
- `leaderElection` per service

### `leaderElection` for all services

In this mode (default) all kube-vip pods will elect a leader and this leader will be in charge of exposing all service addresses through ARP. This mode can become a bottleneck as traffic for **all** services will come to a single node.

### `leaderElection` per service

In this mode kube-vip will perform an election evertime a new Kubernetes service is created, this will allow service addresses to be spread across all nodes where a kube-vip pod is running. 