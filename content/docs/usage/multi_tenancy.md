---
title: "Multi-Tenancy"
weight: 56
description: >
  multi-tenant kube-vip
---

## Multiple kube-vip deployments

The default behaviour for kube-vip is to simply have a single cloud-controller (providing the IPAM) and a global kube-vip deployment that actually implements the load-balancing. However from version `v.0.5.5` it is possible to have a single cloud-controller and multiple kube-vip deployments per namespace. 

### RBAC (per namespace) for kube-vip

Below will create a `Role` that will provide the required access within our namespace `finance`, additionally a service account and the binding to the role will also be created. 

**note:** chance `finance` to which ever namespace you will be using

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: kube-vip-role
  namespace: finance
rules:
  - apiGroups: [""]
    resources: ["services", "services/status", "nodes", "endpoints"]
    verbs: ["list","get","watch", "update"]
  - apiGroups: ["coordination.k8s.io"]
    resources: ["leases"]
    verbs: ["list", "get", "watch", "update", "create"]
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kube-vip
  namespace: finance
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: kube-vip-binding
  namespace: finance
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: kube-vip-role
subjects:
- kind: ServiceAccount
  name: kube-vip
  namespace: finance
```

## Deploying kube-vip into a namespace

When deploying kube-vip into a namespace there are a few things that need to be observed in the manifest. 

### Deploying into the correct namespace

Ensure that the `metadata.namespace` uses your correct namespace.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  namespace: finance
```

### Ensure kube-vip knows which services it should be watching for

The final piece of the puzzle is to set the `svc_namespace` correctly.

```yaml
    spec:
      containers:
      {...}
        env:
        - name: svc_namespace
          value: "finance"
```

### Prometheus conflicts

By default prometheus will bind to port `2112`, this isn't normally a problem however if we have multiple kube-vip deployments running on the same node they will have port conflicts (this is because kube-vip requires `hostNetworking`). You can either change each deployment to use it's own specific port for prometheus or change the default value to blank as shown below:

```yaml
    spec:
      containers:
      - args:
        - manager
        - --prometheusHTTPServer
        - ""
```
