```conf
# The Kernel protocol is not a real routing protocol. Instead of communicating
# with other routers in the network, it performs synchronization of BIRD's
# routing tables with the OS kernel.

filter anycast_nets_v4 {
    if (net ~ [{{ k8s.v4.service.loadbalanced.cidrs | map('regex_replace', '^(.*?)$', '\\1+') | join(", ") }}]) then {
      bgp_community.add(({{ private_as_number }}, {{ bgp_community }}));
      bgp_community.add(({{ private_as_number }}, 42));
      accept;
    }
    reject;
}


filter anycast_nets_v6 {
    if (net ~ [{{ k8s.v6.service.loadbalanced.cidrs | map('regex_replace', '^(.*?)$', '\\1+') | join(", ") }}]) then {
      bgp_community.add(({{ private_as_number }}, {{ bgp_community }}));
      bgp_community.add(({{ private_as_number }}, 42));
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
        export where dest != RTD_UNREACHABLE;	# Actually insert routes into the kernel routing table
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
        export where dest != RTD_UNREACHABLE;	# Actually insert routes into the kernel routing table
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
    if ( ({{ private_as_number }}, 42) ~ bgp_community ) then {
        # k8s_kniffel
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