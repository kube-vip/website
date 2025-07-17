---
title: "Routing Table Mode"
weight: 52
description: >
  Specific use cases for kube-vip.
---

## Use BIRD to read routes from kube-vips table

To read the routes which were written into the routing-table of the kubernetes node by kube-vip.
You need to install a routing-daemon on the node.

```console
apt install bird2
```

Configure the following files according to your setup.
If you need more guidance on how **bird** should be configured have a look at the [excellent guide](https://bird.network.cz/?get_doc&f=bird.html&v=20).

```conf
## /etc/bird.conf
#This file is managed by Ansible. Local changes will be overwritten.

# Change this into your BIRD router ID. It's a world-wide unique identification
# of your router, usually one of router's IPv4 addresses.
router id 127.0.0.1;

# The Device protocol is not a real routing protocol. It doesn't generate any
# routes and it only serves as a module for getting information about network
# interfaces from the kernel.
protocol device {
}

include "/etc/bird.d/*.conf";

protocol bgp <neigh>_v4 {
    local as 65535;
    neighbor <neighbor-ip> as 65535;
    ipv4 {
        export filter export_to_rr_v4;
        import filter import_from_rr;
    };
}
protocol bgp <neigh>_v6 {
    local as 65535;
    neighbor <neighbor-ipv6> as 65535;
    ipv6 {
        export filter export_to_rr_v6;
        import filter import_from_rr;
    };
}
### additional neighbors as above
### ....
```

```conf
## /etc/bird.d/kube-vip.conf
# The Kernel protocol is not a real routing protocol. Instead of communicating
# with other routers in the network, it performs synchronization of BIRD's
# routing tables with the OS kernel.

filter anycast_nets_v4 {
    if (net ~ [10.0.0.0/27+]) then {
      bgp_community.add((65535, 16000));
      bgp_community.add((65535, 42));
      accept;
    }
    reject;
}


filter anycast_nets_v6 {
    if (net ~ [fd00::/64+]) then {
      bgp_community.add((65535, 16000));
      bgp_community.add((65535, 42));
      accept;
    }
    reject;
}


ipv4 table lbv4;
ipv6 table lbv6;

protocol kernel lb_v4 {
    learn;
    kernel table 198;
    scan time 1;
    metric 64; # Use explicit kernel route metric to avoid collisions
               # with non-BIRD routes in the kernel routing table
    ipv4 {
        table lbv4;
        import filter anycast_nets_v4;
        export where dest != RTD_UNREACHABLE; # Actually insert routes into the kernel routing table
    };
}

protocol kernel lb_v6 {
    learn;
    kernel table 198;
    scan time 1;
    metric 64; # Use explicit kernel route metric to avoid collisions
               # with non-BIRD routes in the kernel routing table
    ipv6 {
        table lbv6;
        import filter anycast_nets_v6;
        export where dest != RTD_UNREACHABLE; # Actually insert routes into the kernel routing table
    };
}

protocol pipe lb_pipe_v4 {
    table master4;
    peer table lbv4;
    import all;
    export none;
}
protocol pipe lb_pipe_v6 {
    table master6;
    peer table lbv6;
    import all;
    export none;
}

filter import_from_rr {
    if ( (65535, 42) ~ bgp_community ) then {
        accept;
    }
    reject;
}

filter export_to_rr_v4 {
    if ( proto = "lb_v4" ) then {
        accept;
    }
    reject;
}

filter export_to_rr_v6 {
    if ( proto = "lb_v6" ) then {
        accept;
    }
    reject;
}
```

## Look into your routing tables in Bird

```console
bird> show protocols
Name       Proto      Table      State  Since         Info
device1    Device     ---        up     2025-06-20    
lb_v4      Kernel     lbv4       up     2025-06-20    
lb_v6      Kernel     lbv6       up     2025-06-20    
lb_pipe_v4 Pipe       ---        up     2025-06-20    master4 <=> lbv4
lb_pipe_v6 Pipe       ---        up     2025-06-20    master6 <=> lbv6 
<neigh>_v4 BGP        ---        up     2025-06-20    Established   
<neigh>_v6 BGP        ---        up     2025-06-20    Established   
```

Have a look at IPv4

```console
bird> show route protocol lb_v4 stats
Table lbv4:
10.0.0.18/32     unicast [lb_v4 2025-07-13] * (10)
	dev lo
10.0.0.17/32     unicast [lb_v4 2025-07-05] * (10)
	dev lo
2 of 2 routes for 2 networks in table lbv4
```

Have a look at IPv6

```console
bird> show route protocol lb_v6 stats
Table lbv6:
fd00::5/128 unicast [lb_v6 2025-07-13] * (10)
	dev lo
fd00::7/128 unicast [lb_v6 2025-06-20] * (10)
	dev lo
fd00::4/128 unicast [lb_v6 2025-07-05] * (10)
	dev lo
3 of 3 routes for 3 networks in table lbv6
```
