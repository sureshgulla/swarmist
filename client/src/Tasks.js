import React, { Component } from 'react';
import Subheader from 'material-ui/Subheader';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import IdField from './IdField';

class Tasks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: []
    };
  }

  loadTasks() {
    fetch('/api/tasks', {
      accept: 'application/json'
    })
      .then((response) => {
        return response.json();
      })
      .then((tasks) => {
        this.setState({
          tasks: tasks
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  componentDidMount() {
    this.loadTasks();
    setInterval(this.loadTasks.bind(this), 1000);
  }

  render() {
    if(!this.state.tasks || !this.state.tasks.length || !this.props.selectedServices.length) {
      return (<div>
        <hr/>
      </div>);
    } else {
      const filteredTasks =
        this.state.tasks.filter((task) => 
          this.props.selectedServices.indexOf(task.ServiceID) !== -1
        );

      return (
        <div>
          <hr />
          <Subheader>Tasks</Subheader>
          <Table selectable={false}>
            <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
              <TableRow>
                <TableHeaderColumn>ID</TableHeaderColumn>
                <TableHeaderColumn>Image</TableHeaderColumn>
                <TableHeaderColumn>Message</TableHeaderColumn>
                <TableHeaderColumn>State</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody displayRowCheckbox={false}>
              {filteredTasks.map((task, index) => (
                <TableRow key={index}>
                  <TableRowColumn>&nbsp;&nbsp;&mdash;&nbsp;<IdField value={task.ID}></IdField></TableRowColumn>
                  <TableRowColumn>{task.Spec.ContainerSpec.Image}</TableRowColumn>
                  <TableRowColumn>{task.Status.Message}</TableRowColumn>
                  <TableRowColumn>{task.Status.State}<br/>{task.Status.Err}</TableRowColumn>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
  }
}

export default Tasks;
