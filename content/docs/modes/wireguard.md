---
title: "Wireguard"
weight: 24
description: >
  kube-vip Wireguard mode
---

The [**Wireguard**](https://www.wireguard.com/) mode allows Kubernetes services to be advertised over the wireguard interface (`wg0`), it's main use-case is so that distributed services across multiple clusters can centralise all their advised services on a central network controlled by wireguard.