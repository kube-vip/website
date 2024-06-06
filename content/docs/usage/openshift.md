---
title: "Openshift"
weight: 58
description: >
  Using kube-vip on Redhat Openshift
---

The installation for kube-vip is largely similar to most other Kubernetes distributions, however we need to account for some of the unique architectures within Openshift.

## Creating a project in your OpenShift cluster

We can create a project utilising the `oc` command:

`oc new-project kubevip`

(This will now also move the context to this project)

`oc apply -f https://kube-vip.io/manifests/rbac.yaml` 

We will also need to apply the manifests for the cloud provider and create the manifest for the kube-vip deamonset (either using ARP or BGP). 

Once done we can confirm our pods are up and running:

```
oc get pods -A | grep kube-vip
kube-system   kube-vip-ds-rf4r5   1/1     Running     0              3m3s
kube-system   kube-vip-ds-zhckf   1/1     Running     0              3m3s

oc logs -n kube-system   kube-vip-ds-zhckf

time="2024-05-14T15:00:41Z" level=info msg="Starting kube-vip.io [xxxx]"
time="2024-05-14T15:00:41Z" level=debug msg="Build kube-vip.io [xxxxxxxxxxxxxxxxxxx]"
time="2024-05-14T15:00:41Z" level=info msg="namespace [kube-system], Mode: [ARP], Features(s): Control Plane:[false], Services:[true]"
time="2024-05-14T15:00:41Z" level=info msg="No interface is specified for VIP in config, auto-detecting default Interface"
```

## Creating a Security Context Constraints for kube-vip

The requirements for the SCC are as follows:

```    
    securityContext:        -------------------------------->>>> Mention all the capabilities you want to assign to the pod 
      capabilities:
        add:
        - NET_ADMIN
        - NET_RAW
```

Additionally either `hostnetwork` or `hostnetwork-v2` will be required so that we can access the underlying adapters.