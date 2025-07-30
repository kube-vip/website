---
title: "Troubleshooting RoutingTable"
weight: 98
description: >
  kube-vip Troubleshooting
---

## Check IPv4 Routes

```console
$ ip r show table 198
> 10.0.0.17 dev lo proto 248
> 10.0.0.18 dev lo proto 248
```

## Check IPv6 Routes

```console
$ ip -6 r show table 198
> fd00::4 dev lo proto 248 metric 1024 pref medium
> fd00::5 dev lo proto 248 metric 1024 pref medium
> fd00::7 dev lo proto 248 metric 1024 pref medium

```

## Monitor Route Events

```console
$ ip monitor route
> 10.0.0.1 via 192.168.188.1 dev lo 
> Deleted 10.0.0.1 via 192.168.188.1 dev lo 

```
