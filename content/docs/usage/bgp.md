---
title: "kube-vip ❤️ goBGP"
weight: 52
description: >
  Specific use cases for kube-vip.
---

## Configuration

BGP support in kube-vip can be enabled and configured with several environment variables or CLI flags.

  | Env | Flag | Default value | Meaning | 
  |-----|------|---------------|---------|
  | bgp_enable | bgp | false | Enable BGP support within kube-vip |
  | bgp_attach_ip_to_interface | bgpAttachIPToInterface | false | If configured, kube-vip will create a VIP for each processed service and will add this VIP to the specified network interface |
  | bgp_routerid | bgpRouterID | - | The router ID for the BGP server |
  | bgp_routerinterface | - | - | The interface in which we can find the address for the router, not to be used with `bgp_routerid` |
  | bgp_as | localAS | 65000 | Defines AS for the BGP server |
  | bgp_peeraddress | peerAddress | - | The address of a BGP peer |
  | bgp_peeras | peerAS | 65000 | AS for a BGP peer |
  | bgp_peerpass | peerPass | - | The md5 password for a BGP peer |
  | bgp_peers | bgppeers | - | Comma-separated BGP Peers, format: address:as:password:multihop:mp-bgp:bfd |
  | bgp_multihop | multihop | false | Enables BGP multihop support |
  | bgp_sourceif | sourceIF | - | The source interface for bgp peering (not to be used with `bgp_sourceip`) |
  | bgp_sourceip | sourceIP | - | The source address for bgp peering (not to be used with `bgp_sourceif`) |
  | bgp_keepalive_interval | bgpKeepAliveInterval | 10 | The keepalive interval for all bgp peers (it defines the heartbeat of keepalive messages) |
  | bgp_hold_time | bgpHoldTimer | 30 | The hold timer for all bgp peers (it defines the time a session is held) |
  | mpbgp_ipv4 | - | - | Specifies fixed IPv4 address used by MP-BGP |
  | mpbgp_ipv6 | - | - | Specifies fixed IPv6 address used by MP-BGP |

### Configuring peers with `bgp_peers` env or `bgppeers` flag

The environment variable `bgp_peers` and CLI flag `bgppeers` can be used to configure multiple BGP peers. It accepts comma separated list of peers in the following format:

```
address:as:password:multihop:MP-BGP:BFD
```

Where:

| Field | Type | Meaning |
|-------|------|---------|
| address | string | IP address of the BGP peer. If IPv6 is used, address should be enclosed in brackets, eg. `[fc00::]`. |
| as | uint | Peer's AS | 
| password | string | The md5 password for a BGP peer |
| multihop | bool |  Enables BGP multihop support for the peer |
| MP-BGP | string | Configures Multiprotocol-BGP for the peer. More info in the [BGP Multi-Protocol chapter](#bgp-multi-protocol)|
| BFD | string | Configures Bidirectional Forwarding Detection (BFD) for the peer. See chapter [Bidirectional Forwarding Detection (BFD)](#bidirectional-forwarding-detection-bfd)|

## BGP Multi-Protocol

The goBGP speaker supports multi-protocol BGP sessions.

It supports the following modes:

* IPv4 over IPv6 next-hop
* IPv6 over IPv4 next-hop

BGP Multi-Protocol is configured on a per-peer basis by `bgp_peers` env or `bgppeers` flag. It can be configured using multiple `option=parameter` pairs separated with a semicolon. The possible options and their parameters are as follows:

| Option | Parameter | Meaning |
|-------|-----------|---------|
| mpbgp_nexthop | | Configures MP-BGP mode |
| | fixed |Use fixed IPv4 or IPv6 address provided with `mpbgp_ipv4` or `mpbgp_ipv6` parameter |
| | auto_sourceif | Use the interface provided with bgp_sourceif to automatically find an IP addresses for MP-BGP |
| | auto_sourceip | Use the address provided with bgp_sourceip to automatically find an IP addresses for MP-BGP |
| mpbgp_ipv4 | \<address\> | Defines the IPv4 that should be used for MP-BGP (IPv4 over IPv6) when `mpbgp_nexthop=fixed`. |
| mpbgp_ipv6 | \<address\> | Defines the IPv6 that should be used for MP-BGP (IPv6 over IPv4) when `mpbgp_nexthop=fixed`. |

> Example: To use the fixed IPv4 address `192.168.100.100` over IPv6, configure MP-BGP with `mpbgp_nexthop=fixed;mpbgp_ipv4=192.168.100.100`.

## Bidirectional Forwarding Detection (BFD)

Starting with version `1.2.2`, kube-vip supports Bidirectional Forwarding Detection (BFD) in BGP mode. BFD support is configured as the last parameter in the `bgp_peers` env/`bgppeers` flag. It accepts semicolon-separated list of the following parameters:

```
enable;receive_interval;transmit_interval;detect_multiplier
```

The meaning of those parameters:

| Parameter | Type | Meaning |
|-----------|------|---------|
| enable | bool | If `true` enables BFD support for the peer |
| bfd_receive_interval | uint | Configures receive interval (in milliseconds) |
| bfd_transmit_interval | uint | Configures transmit interval (in milliseconds)|
| bfd_detect_multiplier | uint | Configures the local detection multiplier |

> Example: To configure a peer to use BFD with receive and transmit intervals of 300ms, and multiplier of 3, use: `true;300;300;3`.
