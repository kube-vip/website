---
title: "Features"
weight: 4
description: >
  Kube-Vip features.
---

Kube-Vip was originally created to provide a HA solution for the Kubernetes control plane, but over time it has evolved to incorporate that same functionality for Kubernetes Services of type [LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#loadbalancer). Some of the features include:

- VIP addresses can be IPv4, IPv6, or DNS name
- Control plane load balancing:
  - Floating IP in ARP (Layer 2) or BGP (Layer 3) modes
  - Uses [leader election](https://godoc.org/k8s.io/client-go/tools/leaderelection)
  - Support for `kubeadm`-provisioned clusters (via static Pods)
  - Support for K3s and others (via DaemonSets)
  - [IPVS](https://en.wikipedia.org/wiki/IP_Virtual_Server) mode for true load balancing (kube-vip ≥ 0.4)
  - Dynamic DNS support
- Service of type `LoadBalancer`:
  - Uses [leader election](https://godoc.org/k8s.io/client-go/tools/leaderelection) for ARP (Layer 2)
  - Multiple nodes with BGP
  - Address pools scoped per Namespace or cluster
  - Addresses from CIDR blocks or IP ranges
  - DHCP support
  - Exposure to gateways via UPnP
- Automated manifest generation, vendor API integrations, and much more...
