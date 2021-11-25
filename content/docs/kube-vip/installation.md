---
title: "Installation"
weight: 7
description: >
  Installation.
---

## Static Pods

[Static Pods](https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/) are Kubernetes Pods that are run by the `kubelet` on a single node and are not managed by the Kubernetes cluster itself. This means that whilst the Pod can appear within Kubernetes, it can't make use of a variety of Kubernetes functionality (such as the Kubernetes token or ConfigMap resources). The static Pod approach is primarily required for [kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/) as this is due to the sequence of actions performed by `kubeadm`. Ideally, we want `kube-vip` to be part of the Kubernetes cluster, but for various bits of functionality we also need `kube-vip` to provide a HA virtual IP as part of the installation.

The sequence of events for building a highly available Kubernetes cluster with `kubeadm` and `kube-vip` are as follows:

1. Generate a `kube-vip` manifest in the static Pods manifest directory (see the [generating a manifest](#generating-a-manifest) section below).
2. Run `kubeadm init` with the `--control-plane-endpoint` flag using the VIP address provided when generating the static Pod manifest.
3. The `kubelet` will parse and execute all manifests, including the `kube-vip` manifest generated in step one and the other control plane components including `kube-apiserver`.
4. `kube-vip` starts and advertises the VIP address.
5. The `kubelet` on this first control plane will connect to the VIP advertised in the previous step.
6. `kubeadm init` finishes successfully on the first control plane.
7. Using the output from the `kubeadm init` command on the first control plane, run the `kubeadm join` command on the remainder of the control planes.
8. Copy the generated `kube-vip` manifest to the remainder of the control planes and place in their static Pods manifest directory (default of `/etc/kubernetes/manifests/`).

## Kube-Vip as HA, Load Balancer, or both

The functionality of `kube-vip` depends on the flags used to create the static Pod manifest. By passing in `--controlplane` we instruct `kube-vip` to provide and advertise a virtual IP to be used by the control plane. By passing in `--services` we tell `kube-vip` to provide load balancing for Kubernetes Service resources created inside the cluster. With both enabled, `kube-vip` will manage a virtual IP address that is passed through its configuration for a highly available Kubernetes cluster. It will also watch Services of type `LoadBalancer` and once their `spec.LoadBalancerIP` is updated (typically by a cloud controller, including (optionally) the one provided by kube-vip in [on-prem](/usage/on-prem) scenarios) it will advertise this address using BGP/ARP. In this example, we will use both when generating the manifest.

## Generating a Manifest

In order to create an easier experience of consuming the various functionality within `kube-vip`, we can use the `kube-vip` container itself to generate our static Pod manifest. We do this by running the `kube-vip` image as a container and passing in the various [flags](/flags/) for the capabilities we want to enable.

### Set configuration details

We use environment variables to predefine the values of the inputs to supply to `kube-vip`.

Set the `VIP` address to be used for the control plane:

`export VIP=192.168.0.40`

Set the `INTERFACE` name to the name of the interface on the control plane(s) which will announce the VIP. In many Linux distributions this can be found with the `ip a` command.

`export INTERFACE=ens160`

Get the latest version of the `kube-vip` release by parsing the GitHub API. This step requires that `jq` and `curl` are installed.

`KVVERSION=$(curl -sL https://api.github.com/repos/kube-vip/kube-vip/releases | jq -r ".[0].name")`

To set manually instead, find the desired [release tag](https://github.com/kube-vip/kube-vip/releases):

`export KVVERSION=v0.4.0`

### Creating the manifest

With the input values now set, we can pull and run the `kube-vip` image supplying it the desired flags and values. Once the static Pod manifest is generated for your desired method (ARP or BGP), if running multiple control plane nodes, ensure it is placed in each control plane's static manifest directory (by default, `/etc/kubernetes/manifests`).

Depending on the container runtime, use one of the two aliased commands to create a `kube-vip` command which runs the `kube-vip` image as a container.

For containerd, run the below command:

`alias kube-vip="ctr run --rm --net-host ghcr.io/kube-vip/kube-vip:$KVVERSION vip /kube-vip"`

For Docker, run the below command:

`alias kube-vip="docker run --network host --rm ghcr.io/kube-vip/kube-vip:$KVVERSION"`

### ARP

With the inputs and alias command set, we can run the `kube-vip` container to generate a static Pod manifest which will be directed to a file at `/etc/kubernetes/manifests/kube-vip.yaml`. As such, this is assumed to run on the first control plane node.

This configuration will create a manifest that starts `kube-vip` providing control plane VIP and Kubernetes Service management using the `leaderElection` method and ARP. When this instance is elected as the leader, it will bind the `vip` to the specified `interface`. This is the same behavior for Services of type `LoadBalancer`.

> Note: When running these commands on a to-be control plane node, `sudo` access may be required along with pre-creation of the `/etc/kubernetes/manifests/` directory.

```
kube-vip manifest pod \
    --interface $INTERFACE \
    --address $VIP \
    --controlplane \
    --services \
    --arp \
    --leaderElection | tee /etc/kubernetes/manifests/kube-vip.yaml
```

#### Example ARP Manifest

```
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  name: kube-vip
  namespace: kube-system
spec:
  containers:
  - args:
    - manager
    env:
    - name: vip_arp
      value: "true"
    - name: port
      value: "6443"
    - name: vip_interface
      value: ens192
    - name: vip_cidr
      value: "32"
    - name: cp_enable
      value: "true"
    - name: cp_namespace
      value: kube-system
    - name: vip_ddns
      value: "false"
    - name: svc_enable
      value: "true"
    - name: vip_leaderelection
      value: "true"
    - name: vip_leaseduration
      value: "5"
    - name: vip_renewdeadline
      value: "3"
    - name: vip_retryperiod
      value: "1"
    - name: address
      value: 192.168.0.40
    image: ghcr.io/kube-vip/kube-vip:v0.4.0
    imagePullPolicy: Always
    name: kube-vip
    resources: {}
    securityContext:
      capabilities:
        add:
        - NET_ADMIN
        - NET_RAW
        - SYS_TIME
    volumeMounts:
    - mountPath: /etc/kubernetes/admin.conf
      name: kubeconfig
  hostAliases:
  - hostnames:
    - kubernetes
    ip: 127.0.0.1
  hostNetwork: true
  volumes:
  - hostPath:
      path: /etc/kubernetes/admin.conf
    name: kubeconfig
status: {}
```

### BGP

This configuration will create a manifest that starts `kube-vip` providing control plane VIP and Kubernetes Service management. Unlike ARP, all nodes in the BGP configuration will advertise virtual IP addresses.

**Note** we bind the address to `lo` as we don't want multiple devices that have the same address on public interfaces. We can specify all the peers in a comma-separated list in the format of `address:AS:password:multihop`.

`export INTERFACE=lo`

```
kube-vip manifest pod \
    --interface $INTERFACE \
    --address $VIP \
    --controlplane \
    --services \
    --bgp \
    --localAS 65000 \
    --bgpRouterID 192.168.0.2 \
    --bgppeers 192.168.0.10:65000::false,192.168.0.11:65000::false | tee /etc/kubernetes/manifests/kube-vip.yaml
```

#### Example BGP Manifest

```
apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  name: kube-vip
  namespace: kube-system
spec:
  containers:
  - args:
    - manager
    env:
    - name: vip_arp
      value: "false"
    - name: port
      value: "6443"
    - name: vip_interface
      value: ens192
    - name: vip_cidr
      value: "32"
    - name: cp_enable
      value: "true"
    - name: cp_namespace
      value: kube-system
    - name: vip_ddns
      value: "false"
    - name: bgp_enable
      value: "true"
    - name: bgp_routerid
      value: 192.168.0.2
    - name: bgp_as
      value: "65000"
    - name: bgp_peeraddress
    - name: bgp_peerpass
    - name: bgp_peeras
      value: "65000"
    - name: bgp_peers
      value: 192.168.0.10:65000::false,192.168.0.11:65000::false
    - name: address
      value: 192.168.0.40
    image: ghcr.io/kube-vip/kube-vip:v0.3.9
    imagePullPolicy: Always
    name: kube-vip
    resources: {}
    securityContext:
      capabilities:
        add:
        - NET_ADMIN
        - NET_RAW
        - SYS_TIME
    volumeMounts:
    - mountPath: /etc/kubernetes/admin.conf
      name: kubeconfig
  hostAliases:
  - hostnames:
    - kubernetes
    ip: 127.0.0.1
  hostNetwork: true
  volumes:
  - hostPath:
      path: /etc/kubernetes/admin.conf
    name: kubeconfig
status: {}
```

## DaemonSet

Some Kubernetes distributions can bring up a Kubernetes cluster without depending on a pre-existing VIP (but they may be configured to support one). A prime example of this would be K3s which can be configured to start and also sign the certificates to allow incoming traffic to a virtual IP. Given we don't need the VIP to exist before the cluster, we can bring up the K3s node(s) and then add `kube-vip` as a DaemonSet for all control plane nodes.

If the Kubernetes installer allows for adding a virtual IP as an additional [SAN](https://en.wikipedia.org/wiki/Subject_Alternative_Name) to the API server certificate, we can apply `kube-vip` to the cluster once the first node has been brought up.

Unlike running `kube-vip` as a [static Pod](/install_static) there are a few more things that may need configuring when running `kube-vip` as a DaemonSet. This page will cover primarily the differences.

## Kube-Vip as HA, Load Balancer, or both

The functionality of `kube-vip` depends on the flags used to create the static Pod manifest. By passing in `--controlplane` we instruct `kube-vip` to provide and advertise a virtual IP to be used by the control plane. By passing in `--services` we tell `kube-vip` to provide load balancing for Kubernetes Service resources created inside the cluster. With both enabled, `kube-vip` will manage a virtual IP address that is passed through its configuration for a highly available Kubernetes cluster. It will also watch Services of type `LoadBalancer` and once their `spec.LoadBalancerIP` is updated (typically by a cloud controller, including (optionally) the one provided by kube-vip in [on-prem](/usage/on-prem) scenarios) it will advertise this address using BGP/ARP. In this example, we will use both when generating the manifest.

## Create the RBAC settings

Since `kube-vip` as a DaemonSet runs as a regular resource instead of a static Pod, it still needs the correct access to be able to watch Kubernetes Services and other objects. In order to do this, RBAC resources must be created which include a ServiceAccount, ClusterRole, and ClusterRoleBinding and can be applied this with the command:

```
kubectl apply -f https://kube-vip.io/manifests/rbac.yaml
```

## Generating a Manifest

In order to create an easier experience of consuming the various functionality within `kube-vip`, we can use the `kube-vip` container itself to generate our DaemonSet manifest. We do this by running the `kube-vip` image as a container and passing in the various [flags](/flags/) for the capabilities we want to enable. Generating a `kube-vip` manifest for running as a DaemonSet is almost identical to the process when running `kube-vip` as a [static Pod](/install_static). Only a few flags are different between the two processes. Therefore, refer back to the [Generating a Manifest](/install_static/#generating-a-manifest) section on the [static Pod installation page](/install_static) for the main process steps.

### ARP Example for DaemonSet

When creating the `kube-vip` installation manifest as a DaemonSet, the `manifest` subcommand takes the value `daemonset` as opposed to the `pod` value. The flags `--inCluster` and `--taint` are also needed to configure the DaemonSet to use a ServiceAccount and affine the `kube-vip` Pods to control plane nodes thereby preventing them from running on worker instances.

```
kube-vip manifest daemonset \
    --interface $INTERFACE \
    --address $VIP \
    --inCluster \
    --taint \
    --controlplane \
    --services \
    --arp \
    --leaderElection
```

#### Example ARP Manifest

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  creationTimestamp: null
  name: kube-vip-ds
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: kube-vip-ds
  template:
    metadata:
      creationTimestamp: null
      labels:
        name: kube-vip-ds
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: node-role.kubernetes.io/master
                operator: Exists
            - matchExpressions:
              - key: node-role.kubernetes.io/control-plane
                operator: Exists
      containers:
      - args:
        - manager
        env:
        - name: vip_arp
          value: "true"
        - name: port
          value: "6443"
        - name: vip_interface
          value: ens160
        - name: vip_cidr
          value: "32"
        - name: cp_enable
          value: "true"
        - name: cp_namespace
          value: kube-system
        - name: vip_ddns
          value: "false"
        - name: svc_enable
          value: "true"
        - name: vip_leaderelection
          value: "true"
        - name: vip_leaseduration
          value: "5"
        - name: vip_renewdeadline
          value: "3"
        - name: vip_retryperiod
          value: "1"
        - name: address
          value: 192.168.0.40
        image: ghcr.io/kube-vip/kube-vip:v0.4.0
        imagePullPolicy: Always
        name: kube-vip
        resources: {}
        securityContext:
          capabilities:
            add:
            - NET_ADMIN
            - NET_RAW
            - SYS_TIME
      hostNetwork: true
      serviceAccountName: kube-vip
      tolerations:
      - effect: NoSchedule
        operator: Exists
      - effect: NoExecute
        operator: Exists
  updateStrategy: {}
status:
  currentNumberScheduled: 0
  desiredNumberScheduled: 0
  numberMisscheduled: 0
  numberReady: 0
```

### BGP Example for DaemonSet

This configuration will create a manifest that starts `kube-vip` providing control plane VIP and Kubernetes Service management. Unlike ARP, all nodes in the BGP configuration will advertise virtual IP addresses.

**Note** we bind the address to `lo` as we don't want multiple devices that have the same address on public interfaces. We can specify all the peers in a comma-separated list in the format of `address:AS:password:multihop`.

`export INTERFACE=lo`

```
kube-vip manifest daemonset \
    --interface $INTERFACE \
    --address $VIP \
    --inCluster \
    --taint \
    --controlplane \
    --services \
    --bgp \
    --localAS 65000 \
    --bgpRouterID 192.168.0.2 \
    --bgppeers 192.168.0.10:65000::false,192.168.0.11:65000::false

```

#### Example BGP Manifest

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  creationTimestamp: null
  name: kube-vip-ds
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: kube-vip-ds
  template:
    metadata:
      creationTimestamp: null
      labels:
        name: kube-vip-ds
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: node-role.kubernetes.io/master
                operator: Exists
            - matchExpressions:
              - key: node-role.kubernetes.io/control-plane
                operator: Exists
      containers:
      - args:
        - manager
        env:
        - name: vip_arp
          value: "false"
        - name: port
          value: "6443"
        - name: vip_interface
          value: ens160
        - name: vip_cidr
          value: "32"
        - name: cp_enable
          value: "true"
        - name: cp_namespace
          value: kube-system
        - name: vip_ddns
          value: "false"
        - name: svc_enable
          value: "true"
        - name: bgp_enable
          value: "true"
        - name: bgp_routerid
          value: 192.168.0.2
        - name: bgp_as
          value: "65000"
        - name: bgp_peeraddress
        - name: bgp_peerpass
        - name: bgp_peeras
          value: "65000"
        - name: bgp_peers
          value: 192.168.0.10:65000::false,192.168.0.11:65000::false
        - name: address
          value: 192.168.0.40
        image: ghcr.io/kube-vip/kube-vip:v0.4.0
        imagePullPolicy: Always
        name: kube-vip
        resources: {}
        securityContext:
          capabilities:
            add:
            - NET_ADMIN
            - NET_RAW
            - SYS_TIME
      hostNetwork: true
      serviceAccountName: kube-vip
      tolerations:
      - effect: NoSchedule
        operator: Exists
      - effect: NoExecute
        operator: Exists
  updateStrategy: {}
status:
  currentNumberScheduled: 0
  desiredNumberScheduled: 0
  numberMisscheduled: 0
  numberReady: 0
```

#### Managing a `routerID` as a DaemonSet

The `routerID` needs to be unique on each node that participates in BGP advertisements. In order to do this, we can modify the manifest so that when `kube-vip` starts it will look up its local address and use that as the `routerID`. Add the following to the `env[]` array of the container:

```yaml
- name: bgp_routerinterface
  value: "ens160"
```

### DaemonSet Manifest Overview

Once the manifest for `kube-vip` as a DaemonSet is generated, these are some of the notable differences over the [static Pod](/install_static) manifest and their significance.

- `nodeSelector`: Ensures that DaemonSet Pods only run on control plane nodes.
- `serviceAccountName: kube-vip`: Specifies the ServiceAccount name that will be used to get/update Kubernetes Service resources.
- `tolerations`: Allows scheduling to control plane nodes that normally specify `NoSchedule` or `NoExecute` taints.
