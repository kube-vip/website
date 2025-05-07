---
title: "Troubleshooting RoutingTable"
weight: 98
description: >
  kube-vip Troubleshooting
---

## Check IPv4

```console
$ ip r show table 198
>
```

## Check IPv6

```console
$ ip -6 r show table 198
>
```

## Monitor Events

```console
$ ip monitor route
> 10.0.0.1 via 192.168.188.1 dev lo 
> Deleted 10.0.0.1 via 192.168.188.1 dev lo 

```