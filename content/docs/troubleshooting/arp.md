---
title: "Troubleshooting ARP"
weight: 98
description: >
  kube-vip Troubleshooting
---

## Failover times

The "average" failover time that is observed with kube-vip is around ~3 seconds, **however** this can wildly depend on the underlying infrastructure such as virtual and physical switches blocking or limiting kube-vip from updating the network. The most simple test that can be performed to begin working out how your infrastructure is performing is the following:

**Deploy a simple nginx application:**
```
kubectl apply -f https://k8s.io/examples/application/deployment.yaml
```

**Create a loadbalancer service:**
```
kubectl expose deployment nginx-deployment --port=80 --type=LoadBalancer --name=nginx
```

**Get the service address:**
```
kubectl get svc nginx
NAME    TYPE           CLUSTER-IP      EXTERNAL-IP     PORT(S)        AGE
nginx   LoadBalancer   10.102.42.152   192.168.0.218   80:32372/TCP   10m
```

**Set the IP address to a variable for the below tests (change the address for your purposes):**
```
export IP=192.168.0.218
```

**We can now test against our service address!**

The below snippet will create a visual representation of availability of the application, as pods are deleted a dot will be printed every second to show unavailability

```
while true; do curl --output /dev/null --silent --head --fail --connect-timeout 0.1 $IP; if [ $? -ne 0 ]; then   echo -n ".";   DOWN=true; else   if [ $DOWN = true ]; then   echo "";   DOWN=false;   fi; fi; sleep 1; done
```

Additionally we can test access to the VIP with the `ping` command, this will demonstrate the IP address either being no longer available or being re-assigned to a new host.
```
ping -D $IP
```

### Testing access

With this simple monitoring in progress we can watch how long the both kubernetes and kube-vip typically take to reconcile!

Delete a backend pod:
```
kubectl delete pod $(kubectl get pods | grep nginx-deployment | awk '{ print $1 }')
```

Doing this a few times should result in something like the following:
```
..
..
.
.
..
.
```
