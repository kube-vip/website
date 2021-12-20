---
title: "About"
weight: 10
---

kube-vip is an open-source project that aims to simplify providing load balancing services for Kubernetes clusters.

## Why kube-vip

The original purpose of kube-vip was to simplify the building of highly-available (HA) Kubernetes clusters, which at the time involved a few components and configurations that all needed to be managed. This was blogged about in detail by [thebsdbox](https://twitter.com/thebsdbox/) [here](https://thebsdbox.co.uk/2020/01/02/Designing-Building-HA-bare-metal-Kubernetes-cluster/#Networking-load-balancing). Since the project has evolved, it can now use those same technologies to provide load balancing capabilities for Kubernetes Service resources of type `LoadBalancer`.
