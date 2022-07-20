---
title: "Troubleshooting"
weight: 90
description: >
  kube-vip Troubleshooting
---

## Wireguard 

To debug most Wireguard issues you'll need to examine the node that has the leadership or the Wireguard server itself. 

### View Wireguard configuration (server)

The `wg show all` command will detail the peer connections, the peers being the kube-vip leader on the remote cluster.

```
# wg show all
interface: wg0
  public key: g1siqaKYbmAAIM4PxBrzybA2BaKmkzLxG7a2Ffb5sho=
  private key: (hidden)
  listening port: 51820

peer: Zl4q4n6aLOJcLvNxzbsknpUccvJxlXg/e3isNjBF5Gk=
  endpoint: 192.168.0.140:51820
  allowed ips: 10.0.0.0/8
  latest handshake: 1 minute, 21 seconds ago
  transfer: 4.25 MiB received, 1.05 MiB sent
```

### An `allowed ips: (none)` configuration

In the event an peer has no allowed IPs it usually means that two peers were created with the same ip range (which is illegal in Wireguard)

### Enable Wireguard debugging (on the server)
```
echo module wireguard +p > /sys/kernel/debug/dynamic_debug/control
```

Logs can be found with `dmesg`

