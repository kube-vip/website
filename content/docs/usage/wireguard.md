---
title: "Wireguard"
weight: 56
description: >
  kube-vip usage on wireguard.
---

## Pre-requisistes

- This will require kube-vip starting as a daemonset as it will need to read existing data (`secrets`) from inside the cluster.
- A Wireguard server that will act as the merging network point for all external clusters services
- Distinct network ranges for each cluster (an overlap of a range will break one clusters configuration)


## Architecture

On each cluster a secret is created that contains the private key and the address of the wireguard server, on the Wireguard server itself the clusters public key and network range is configured.

```
                                         ┌──────────────────────┐
                                         │                      │
                                         │       Cluster B      │
                                         │                      │
                           ┌─────────────┴──────────────────────┘
                           │
                           │
                           │
                ┌──────────▼─────────┐
                │      Wireguard     │
                │       Server       │
                │      10.1.0.1      │
                └────────▲───────────┘
                         │
                         │
                         │
┌─────────────────────┬──┘
│                     │
│     Cluster A       │
│                     │
└─────────────────────┘
```

A /30 or /29 is recommended for the network range, this can then match the configuration in the cloud-controller **or** services can be created with fixed addresses.

### Secrets

The below command will generate a configuration for a **single** cluster:

The `NETWORKRANGE` needs to be different for each cluster
```
SERVERIP=192.168.0.197
NETWORKRANGE=10.0.0.0/30
```

This latter part of this command will auto-generate the required credentials and configure the server (the command has to be ran on the server), it will then print the secret to be created on the cluster itself.
```
PRIKEY=$(wg genkey)
PUBKEY=$(echo $PRIKEY | wg pubkey)
PEERKEY=$(sudo wg show wg0 public-key)
sudo wg set wg0 peer $PUBKEY allowed-ips $NETWORKRANGE
echo "kubectl create -n kube-system secret generic wireguard --from-literal=privateKey=$PRIKEY --from-literal=peerPublicKey=$PEERKEY --from-literal=peerEndpoint=$SERVERIP"

```