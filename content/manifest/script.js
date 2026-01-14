function handleFormSubmit(event) {
  const daemonset ={
    "apiVersion": "apps/v1",
    "kind": "DaemonSet",
    "metadata": {
       "creationTimestamp": null,
       "labels": {
          "app.kubernetes.io/name": "kube-vip-ds",
          "app.kubernetes.io/version": "v0.8.8"
       },
       "name": "kube-vip-ds",
       "namespace": "kube-system"
    },
    "spec": {
       "selector": {
          "matchLabels": {
             "app.kubernetes.io/name": "kube-vip-ds"
          }
       },
       "template": {
          "metadata": {
             "creationTimestamp": null,
             "labels": {
                "app.kubernetes.io/name": "kube-vip-ds",
                "app.kubernetes.io/version": "v0.8.8"
             }
          },
          "spec": null
       }
    }
 };

  const pod = {
    "apiVersion": "v1",
    "kind": "Pod",
    "metadata": {
       "creationTimestamp": null,
       "name": "kube-vip",
       "namespace": "kube-system"
    },
    "spec": null
  }

    const spec ={
       "containers": [
          {
             "args": [
                "manager"
             ],
             "env": [
                {
                   "name": "port",
                   "value": "6443"
                },
                {
                   "name": "vip_nodename",
                   "valueFrom": {
                      "fieldRef": {
                         "fieldPath": "spec.nodeName"
                      }
                   }
                },
                {
                   "name": "dns_mode",
                   "value": "first"
                },
                {
                   "name": "prometheus_server",
                   "value": ":2112"
                }
             ],
             "image": "",
             "imagePullPolicy": "IfNotPresent",
             "name": "kube-vip",
             "resources": {},
             "securityContext": {
                "capabilities": {
                   "add": [
                      "NET_ADMIN",
                      "NET_RAW"
                   ]
                }
             },
             "volumeMounts": [
                {
                   "mountPath": "/etc/kubernetes/admin.conf",
                   "name": "kubeconfig"
                }
             ]
          }
       ],
       "hostAliases": [
          {
             "hostnames": [
                "kubernetes"
             ],
             "ip": "127.0.0.1"
          }
       ],
       "hostNetwork": true,
       "volumes": [
          {
             "hostPath": {
                "path": "/etc/kubernetes/admin.conf"
             },
             "name": "kubeconfig"
          }
       ]
    };

event.preventDefault();

const data = new FormData(event.target);

const formJSON = Object.fromEntries(data.entries());
  console.log(formJSON)
  // for multi-selects, we need special handling
  formJSON.function = data.getAll('function');
  spec.containers[0].image = "ghcr.io/kube-vip/kube-vip:" + formJSON.version
  const results = document.querySelector('.results pre');

  if (formJSON.mode == "arp")
  {
    spec.containers[0].env.push({"name":"vip_arp", "value":"true"}, {"name":"vip_address","value":formJSON.address},{"name":"vip_interface","value":formJSON.interface})
  }

  if (formJSON.function.includes("control-plane")) {
    spec.containers[0].env.push({"name":"cp_enable","value":"true"},{"name":"cp_namespace","value":"kube-system"})
  }
  if (formJSON.function.includes("services")) {
    spec.containers[0].env.push({"name":"svc_enable","value":"true"})
    if (formJSON.function.includes("servicesle")) {
      spec.containers[0].env.push({"name":"svc_election","value":"true"})
    }
  }
  spec.containers[0].env.push({"name":"vip_loglevel","value":formJSON.loglevel})

if (formJSON.deployment =="pod") {
  pod.spec = spec
  results.innerText = jsyaml.dump(pod)
}
if (formJSON.deployment =="daemonset") {
  daemonset.spec.template.spec = spec
  daemonset.metadata.labels["app.kubernetes.io/version"] = formJSON.version
  daemonset.spec.template.metadata.labels["app.kubernetes.io/version"] = formJSON.version
  results.innerText = jsyaml.dump(daemonset)
}

  console.log(formJSON)
 // results.innerText = jsyaml.dump(pod)
  //results.innerText = YAML.stringify(pod, null, 2);
}

const form = document.querySelector('.contact-form');
form.addEventListener('submit', handleFormSubmit);