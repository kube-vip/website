---
title: "Routing Tables"
weight: 23
description: >
  kube-vip Routing Table mode
---

The **Routing Table** mode is to allow additional routing technologies such as ECMP etc. to be configuraed so that traffic can be send to a range of nodes (such as your Kubernetes nodes), and kube-vip will manage the addition/deletion of addresses to the routing tables of these nodes so that they can recieve the correct traffic.