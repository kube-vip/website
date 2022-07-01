---
title: "Installation"
weight: 20
description: >
  How to install kube-vip.
---

kube-vip provides Kubernetes clusters with a virtual IP and load balancer for both the control plane (for building a highly-available cluster) and Kubernetes Services of type `LoadBalancer` without relying on any external hardware or software.

Current solutions for building a highly-available Kubernetes cluster, when not in the cloud, often involve external hardware, which can be expensive, or external software, which can be complex and difficult to manage. For Kubernetes Service resources of type `LoadBalancer`, you are once again on your own if not in a PaaS environment. kube-vip addresses both of these by packaging them together and running them inside the same Kubernetes cluster they service, simplifying complexity, reducing cost as well as build times.

kube-vip is quite flexible for those Kubernetes Services wanted to be balanced.

There are 2 ways to tell kube-vip to be the load balancer of your Kubernetes Services.

- Don't add a `Annotation` of `kube-vip.io/ignore=true`  in the `svc.Metadata.Annotations`;
- Or, set the `svc.Spec.LoadBalancerClass` to `kube-vip.io/kube-vip-class`;

Also there are 2 ways to tell kube-vip not to be the load balancer of your Kubernetes Services:

- Add a `Annotation` of `kube-vip.io/ignore=true`  in the `svc.Metadata.Annotations`;
- Or, set a different `svc.Spec.LoadBalancerClass` other than `kube-vip.io/kube-vip-class`;

The idea behind kube-vip is a small, self-contained, highly-available option for all environments, especially:

- Bare metal
- On-Premises
- Edge (ARM / Raspberry Pi)
- Virtualisation
- Pretty much anywhere else :)

## Links

- [kube-vip Cloud Provider Repository](https://github.com/kube-vip/kube-vip-cloud-provider)
- [kube-vip Repository](https://github.com/kube-vip/kube-vip)
- [kube-vip RBAC manifest (required for the DaemonSet)](https://kube-vip.io/manifests/rbac.yaml)
