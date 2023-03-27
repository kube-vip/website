---
title: "BGP"
weight: 22
description: >
  kube-vip BGP mode
---

**BGP** is a mechanism so that networks that rely on routing (layer 3) can ensure that new addresses are advertised to the routing infrastructure. When this information has been updated it transparently means that the router will automatically forward traffic to the correct devices. When using BGP we can automatically leverage the networking routers to provide load-balancing at the device.

### Configuration overview

When using kube-vip with BGP various bits of information are required, namely we require the credentials for the devices that will be handling the routing for the network. Most of this is passed in as part of the kube-vip configuration. In some environments kube-vip can use API calls in order to determine this information from the underlying infrastructure.

To understand more look at the BGP section in the [Flags and Environment page](/content/docs/installation/flags.md) or the details should exist on a particular usage page.
