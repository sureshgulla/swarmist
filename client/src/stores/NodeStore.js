import { extendObservable, action, observable } from "mobx";

class NodeStore {
  constructor() {
    extendObservable(this, {
      connected: false,
      error: false,
      info: {},
      tasks: [],
      services: [],
      networks: [],
      selectedServices: [],
      serviceLogs: new observable.map(),

      get isInSwarm() {
        return (
          this.info &&
          this.info.Swarm &&
          this.info.Swarm.LocalNodeState === "active"
        );
      },

      fetchInfo: action(() => {
        fetch("/api/info", {
          accept: "application/json"
        })
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              this.connected = false;
              this.error = `Could not connect to Docker`;
              return response.json().then(body => {
                this.error = `Could not connect to Docker socket`;
                throw new Error("Connection error");
              });
            }
          })
          .then(info => {
            this.connected = true;
            this.info = info;

            if (info.Swarm.LocalNodeState !== "active") {
              this.error = "This node is not running on a swarm.";
            } else if (!info.Swarm.ControlAvailable) {
              this.error = "This node is not running as a swarm manager.";
            } else {
              this.error = null;
            }
          })
          .catch(error => {
            this.connected = false;
          });
      }),

      fetchServices: action(() => {
        fetch("/api/services/", {
          accept: "application/json"
        })
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw response.statusText;
            }
          })
          .then(services => {
            this.services = services;
          })
          .catch(error => {
            this.error = "Error retrieving services";
          });
      }),

      fetchServiceLogs: action(serviceId => {
        fetch(`/api/services/${serviceId}/logs`)
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw response.statusText;
            }
          })
          .then(logs => {
            this.serviceLogs.set(serviceId, logs);
          });
      }),

      fetchTasks: action(() => {
        fetch("/api/tasks", {
          accept: "application/json"
        })
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw response.statusText;
            }
          })
          .then(tasks => {
            tasks.sort((a, b) => {
              if (a.UpdatedAt > b.UpdatedAt) {
                return -1;
              }
              if (a.UpdatedAt < b.UpdatedAt) {
                return 1;
              }
              return 0;
            });

            this.tasks = tasks.filter(
              task =>
                task.DesiredState !== "shutdown" ||
                task.Status.State !== "shutdown"
            );
          })
          .catch(error => {
            this.error = "Error retrieving tasks";
          });
      }),

      fetchNetworks: action(() => {
        fetch("/api/networks", {
          accept: "application/json"
        })
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw response.statusText;
            }
          })
          .then(networks => (this.networks = networks))
          .catch(console.error);
      })
    });

    this.fetchInfo();
    this.fetchServices();
    this.fetchTasks();
    this.fetchNetworks();

    this.unbindPolls = setInterval(() => {
      this.fetchInfo();
      if (this.isInSwarm && !this.error) {
        this.fetchServices();
        this.fetchTasks();
        this.fetchNetworks();
      }
      if (this.selectedServices.length) {
        this.selectedServices.forEach(service => {
          this.fetchServiceLogs(service);
        });
      }
    }, 30000);
  }
}

export default NodeStore;
