---
title: "Routing Tables"
weight: 23
description: >
  kube-vip Routing Table mode
---

The **Routing Table** mode is to allow additional routing technologies such as ECMP etc. The table mode enables kube-vip to manage the addition/deletion of addresses to the routing tables of these nodes so that they can recieve the correct traffic.