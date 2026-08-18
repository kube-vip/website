---
title: "Upgrade"
weight: 20
description: >
  Upgrade kube-vip on a running cluster without recreating the control plane.
---

Keep kube-vip on a current release. You can upgrade an existing cluster in place;
you do **not** need to rebuild control-plane nodes or re-run `kubeadm init`.

## What changes on upgrade

Upgrades replace the kube-vip container image (and optionally regenerate the
manifest when flags or defaults have changed between versions). Leader election
handles the hand-off: when a kube-vip Pod restarts, another instance can take the
VIP, then the upgraded instance rejoins election as usual.

## Choose your install path

| How kube-vip was installed | Upgrade guide |
| --- | --- |
| Static Pod under `/etc/kubernetes/manifests` (typical kubeadm) | [Upgrade using manifest](/docs/upgrade/manifest/) |
| DaemonSet (K3s and similar) | Follow the DaemonSet steps on the [manifest upgrade](/docs/upgrade/manifest/) page |

## Before you start

1. Note the VIP, interface name, and feature flags you use today (ARP/BGP,
   control plane, services, leader election). You will need the same values if
   you regenerate the manifest.
2. Pick a target version from the
   [kube-vip releases](https://github.com/kube-vip/kube-vip/releases) page.
3. For production clusters, upgrade one control-plane node at a time and confirm
   the API server remains reachable on the VIP after each node.
