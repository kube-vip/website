---
title: "Installation"
weight: 2
description: >
  This is the index.
---

Kube-Vip provides Kubernetes clusters with a virtual IP and load balancer for both the control plane (for building a highly-available cluster) and Kubernetes Services of type `LoadBalancer` without relying on any external hardware or software.

Current solutions for building a highly-available Kubernetes cluster, when not in the cloud, often involve external hardware, which can be expensive, or external software, which can be complex and difficult to manage. For Kubernetes Service resources of type `LoadBalancer`, you are once again on your own if not in a PaaS environment. Kube-Vip addresses both of these by packaging them together and running them inside the same Kubernetes cluster they service, simplifying complexity, reducing cost as well as build times.

The idea behind `kube-vip` is a small, self-contained, highly-available option for all environments, especially:

- Bare metal
- On-Premises
- Edge (ARM / Raspberry Pi)
- Virtualisation
- Pretty much anywhere else :)

## Why?

The "original" purpose of `kube-vip` was to simplify the building of highly-available (HA) Kubernetes clusters, which at the time involved a few components and configurations that all needed to be managed. This was blogged about in detail by [thebsdbox](https://twitter.com/thebsdbox/) [here](https://thebsdbox.co.uk/2020/01/02/Designing-Building-HA-bare-metal-Kubernetes-cluster/#Networking-load-balancing). Since the project has evolved, it can now use those same technologies to provide load balancing capabilities for Kubernetes Service resources of type `LoadBalancer`.

## Links

- [Kube-Vip Cloud Provider Repository](https://github.com/kube-vip/kube-vip-cloud-provider)
- [Kube-Vip Repository](https://github.com/kube-vip/kube-vip)
- [Kube-Vip RBAC manifest (required for the DaemonSet)](https://kube-vip.io/manifests/rbac.yaml)
