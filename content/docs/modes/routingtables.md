---
title: "Routing Tables"
weight: 23
description: >
  kube-vip Routing Table mode
---

The **Routing Table** mode is to allow additional routing technologies such as ECMP, VRF awareness etc.. The table mode enables kube-vip to manage the addition/deletion of addresses to the routing tables of these nodes so that they can receive the correct traffic.

### Configuration overview

When using kube-vip with Routing Table it does not use any routing protocol to advertise the IPs on its own. The only thing that happens is, that Routes are configured via netlink in the routing table with ID `198` and routing protocol ID `248` for kube-vip. Both of these values are configurable if they conflict with your stack.

To understand more look at the Routing Table section in the [Flags and Environment page](/docs/installation/flags/) or the details should exist on the [Routing Table Usage page](/docs/usage/routingtables)