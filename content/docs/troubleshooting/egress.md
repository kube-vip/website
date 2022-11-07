---
title: "Troubleshooting Egress"
weight: 98
description: >
  kube-vip Troubleshooting
---

## Error Message `Error configuring egress for loadbalancer`

This message will appear if there are kernel modules that are missing from the system, kube-vip will highlight in the logs which are the missing modules as follows:

`missing iptables modules -> nat [false] -> filter [false] mangle -> [false]`

To install these modules you can do the following:

```
sudo modprobe iptable_filter
sudo modprobe iptable_nat
sudo modprobe iptable_mangle
```

They should also be added to `/etc/modules` for reboot persistence.

## Finding the iptables rules

In order to view the iptables rules created by kube-vip you may need to use the legacy iptables command, you can view the current configuration with `sudo iptables -v`. If `nf_tables` is listed then you will need to use `iptables-legacy` in order to view the correct rules.

### Mangle rules

`iptables-legacy -t mangle -L`

```
sudo iptables-legacy -t mangle -L
Chain PREROUTING (policy ACCEPT)
target     prot opt source               destination
KUBE-VIP-EGRESS  all  --  anywhere             anywhere             /* a3ViZS12aXAK=kube-vip */

{...}

Chain KUBE-VIP-EGRESS (1 references)
target     prot opt source               destination
RETURN     all  --  anywhere             10.0.0.0/16          /* a3ViZS12aXAK=kube-vip */
RETURN     all  --  anywhere             10.96.0.0/12         /* a3ViZS12aXAK=kube-vip */
MARK       all  --  172.17.88.129        anywhere             /* a3ViZS12aXAK=kube-vip */ MARK or 0x40
MARK       all  --  172.17.88.19         anywhere             /* a3ViZS12aXAK=kube-vip */ MARK or 0x40
MARK       all  --  172.17.88.190        anywhere             /* a3ViZS12aXAK=kube-vip */ MARK or 0x40
```

### Destination NAT rules

```
sudo iptables-legacy -t nat -L POSTROUTING

Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination
SNAT       all  --  172.17.88.129        anywhere             mark match 0x40/0x40 /* a3ViZS12aXAK=kube-vip */ to:192.168.0.217
```
