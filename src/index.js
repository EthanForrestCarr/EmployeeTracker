import dotenv from 'dotenv';
import pg from 'pg';
import inquirer from 'inquirer';

dotenv.config();
const { Client } = pg;

const client = new Client({
    host: "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 5432,
});

await client.connect();
await promptUser();

function promptUser() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'View All Departments',
                'View All Roles',
                'View All Employees',
                'View Employees by Manager',
                'View Employees by Department',
                'View Department Budget',
                'Add Department',
                'Add Role',
                'Add Employee',
                'Update Employee Role',
                'Update Employee Manager',
                'Delete Department',
                'Delete Role',
                'Delete Employee',
                'Exit'
            ]
        }
    ]).then((answers) => {
        switch (answers.action) {
            case 'Update Employee Manager':
                updateEmployeeManager();
                break;
            case 'View Employees by Manager':
                viewEmployeesByManager();
                break;
            case 'View Employees by Department':
                viewEmployeesByDepartment();
                break;
            case 'View Department Budget':
                viewDepartmentBudget();
                break;
            case 'Delete Department':
                deleteDepartment();
                break;
            case 'Delete Role':
                deleteRole();
                break;
            case 'Delete Employee':
                deleteEmployee();
                break;
            case 'View All Departments':
                viewAllDepartments();
                break;
            case 'View All Roles':
                viewAllRoles();
                break;
            case 'View All Employees':
                viewAllEmployees();
                break;
            case 'Add Department':
                addDepartment();
                break;
            case 'Add Role':
                addRole();
                break;
            case 'Add Employee':
                addEmployee();
                break;
            case 'Update Employee Role':
                updateEmployeeRole();
                break;
            default:
                client.end();
        }
    });
}

function viewAllDepartments() {
    client.query('SELECT * FROM departments', (err, res) => {
        if (err) {
            console.error(err);
        } else {
            console.table(res.rows);
            promptUser();
        }
    });
}

function viewAllRoles() {
    const query = `
        SELECT roles.id, roles.title, departments.name AS department, roles.salary
        FROM roles
        LEFT JOIN departments ON roles.department_id = departments.id;
    `;

    client.query(query, (err, res) => {
        if (err) {
            console.error('Error fetching roles:', err);
        } else {
            console.table(res.rows);
        }
        promptUser();
    });
}

function viewAllEmployees() {
    const query = `
        SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.name AS department, roles.salary, 
               CONCAT(manager.first_name, ' ', manager.last_name) AS manager
        FROM employees
        LEFT JOIN roles ON employees.role_id = roles.id
        LEFT JOIN departments ON roles.department_id = departments.id
        LEFT JOIN employees manager ON employees.manager_id = manager.id;
    `;

    client.query(query, (err, res) => {
        if (err) {
            console.error('Error fetching employees:', err);
        } else {
            console.table(res.rows);
        }
        promptUser();
    });
}

function addDepartment() {
    inquirer.prompt([
        {
            name: 'departmentName',
            type: 'input',
            message: 'What is the name of the department?',
        }
    ]).then((answer) => {
        const query = `INSERT INTO departments (name) VALUES ($1) RETURNING *`;
        client.query(query, [answer.departmentName], (err, res) => {
            if (err) {
                console.error('Error adding department:', err);
            } else {
                console.log(`Department added:`, res.rows[0]);
            }
            promptUser();
        });
    });
}

function addRole() {
    client.query('SELECT * FROM departments', (err, res) => {
        if (err) {
            console.error('Error fetching departments:', err);
        } else {
            const departments = res.rows.map(({ id, name }) => ({ name: name, value: id }));

            inquirer.prompt([
                {
                    name: 'title',
                    type: 'input',
                    message: 'What is the name of the role?',
                },
                {
                    name: 'salary',
                    type: 'input',
                    message: 'What is the salary for the role?',
                    validate: (value) => isNaN(value) ? 'Please enter a valid number' : true
                },
                {
                    name: 'departmentId',
                    type: 'list',
                    message: 'Which department does the role belong to?',
                    choices: departments
                }
            ]).then((answers) => {
                const query = `
                    INSERT INTO roles (title, salary, department_id) 
                    VALUES ($1, $2, $3) RETURNING *;
                `;
                client.query(query, [answers.title, answers.salary, answers.departmentId], (err, res) => {
                    if (err) {
                        console.error('Error adding role:', err);
                    } else {
                        console.log(`Role added:`, res.rows[0]);
                    }
                    promptUser();
                });
            });
        }
    });
}

function addEmployee() {
    client.query('SELECT * FROM roles', (err, res) => {
        if (err) {
            console.error('Error fetching roles:', err);
        } else {
            const roles = res.rows.map(({ id, title }) => ({ name: title, value: id }));

            client.query('SELECT * FROM employees', (err, res) => {
                if (err) {
                    console.error('Error fetching employees:', err);
                } else {
                    const managers = res.rows.map(({ id, first_name, last_name }) => ({
                        name: `${first_name} ${last_name}`, value: id
                    }));
                    managers.push({ name: 'None', value: null });

                    inquirer.prompt([
                        {
                            name: 'firstName',
                            type: 'input',
                            message: "What's the employee's first name?",
                        },
                        {
                            name: 'lastName',
                            type: 'input',
                            message: "What's the employee's last name?",
                        },
                        {
                            name: 'roleId',
                            type: 'list',
                            message: "What's the employee's role?",
                            choices: roles
                        },
                        {
                            name: 'managerId',
                            type: 'list',
                            message: "Who's the employee's manager?",
                            choices: managers
                        }
                    ]).then((answers) => {
                        const query = `
                            INSERT INTO employees (first_name, last_name, role_id, manager_id) 
                            VALUES ($1, $2, $3, $4) RETURNING *;
                        `;
                        client.query(query, [answers.firstName, answers.lastName, answers.roleId, answers.managerId], (err, res) => {
                            if (err) {
                                console.error('Error adding employee:', err);
                            } else {
                                console.log(`Employee added:`, res.rows[0]);
                            }
                            promptUser();
                        });
                    });
                }
            });
        }
    });
}

function updateEmployeeRole() {
    client.query('SELECT * FROM employees', (err, res) => {
        if (err) {
            console.error('Error fetching employees:', err);
        } else {
            const employees = res.rows.map(({ id, first_name, last_name }) => ({
                name: `${first_name} ${last_name}`, value: id
            }));

            client.query('SELECT * FROM roles', (err, res) => {
                if (err) {
                    console.error('Error fetching roles:', err);
                } else {
                    const roles = res.rows.map(({ id, title }) => ({
                        name: title, value: id
                    }));

                    inquirer.prompt([
                        {
                            name: 'employeeId',
                            type: 'list',
                            message: 'Which employee would you like to update?',
                            choices: employees
                        },
                        {
                            name: 'roleId',
                            type: 'list',
                            message: 'Which role do you want to assign to the selected employee?',
                            choices: roles
                        }
                    ]).then((answers) => {
                        const query = `
                            UPDATE employees SET role_id = $1 WHERE id = $2 RETURNING *;
                        `;
                        client.query(query, [answers.roleId, answers.employeeId], (err, res) => {
                            if (err) {
                                console.error('Error updating employee role:', err);
                            } else {
                                console.log(`Employee role updated:`, res.rows[0]);
                            }
                            promptUser();
                        });
                    });
                }
            });
        }
    });
}

// BONUS FUNCTIONALITY

function updateEmployeeManager() {
    client.query('SELECT * FROM employees', (err, res) => {
        if (err) {
            console.error('Error fetching employees:', err);
        } else {
            const employees = res.rows.map(({ id, first_name, last_name }) => ({
                name: `${first_name} ${last_name}`, value: id
            }));

            inquirer.prompt([
                {
                    name: 'employeeId',
                    type: 'list',
                    message: 'Which employee would you like to update?',
                    choices: employees
                },
                {
                    name: 'managerId',
                    type: 'list',
                    message: "Who's the employee's new manager?",
                    choices: employees.concat([{ name: 'None', value: null }])
                }
            ]).then((answers) => {
                const query = `
                    UPDATE employees SET manager_id = $1 WHERE id = $2 RETURNING *;
                `;
                client.query(query, [answers.managerId, answers.employeeId], (err, res) => {
                    if (err) {
                        console.error('Error updating employee manager:', err);
                    } else {
                        console.log(`Employee manager updated:`, res.rows[0]);
                    }
                    promptUser();
                });
            });
        }
    });
}

function viewEmployeesByManager() {
    const query = `
        SELECT CONCAT(manager.first_name, ' ', manager.last_name) AS manager, 
               CONCAT(e.first_name, ' ', e.last_name) AS employee
        FROM employees e
        LEFT JOIN employees manager ON e.manager_id = manager.id
        ORDER BY manager;
    `;

    client.query(query, (err, res) => {
        if (err) {
            console.error('Error fetching employees by manager:', err);
        } else {
            console.table(res.rows);
        }
        promptUser();
    });
}

function viewEmployeesByDepartment() {
    const query = `
        SELECT departments.name AS department, 
               CONCAT(employees.first_name, ' ', employees.last_name) AS employee
        FROM employees
        JOIN roles ON employees.role_id = roles.id
        JOIN departments ON roles.department_id = departments.id
        ORDER BY departments.name;
    `;

    client.query(query, (err, res) => {
        if (err) {
            console.error('Error fetching employees by department:', err);
        } else {
            console.table(res.rows);
        }
        promptUser();
    });
}
function deleteDepartment() {
    client.query('SELECT * FROM departments', (err, res) => {
        if (err) {
            console.error('Error fetching departments:', err);
        } else {
            const departments = res.rows.map(({ id, name }) => ({ name: name, value: id }));

            inquirer.prompt([
                {
                    name: 'departmentId',
                    type: 'list',
                    message: 'Which department would you like to delete?',
                    choices: departments
                }
            ]).then((answer) => {
                const query = `DELETE FROM departments WHERE id = $1 RETURNING *`;
                client.query(query, [answer.departmentId], (err, res) => {
                    if (err) {
                        console.error('Error deleting department:', err);
                    } else {
                        console.log(`Department deleted:`, res.rows[0]);
                    }
                    promptUser();
                });
            });
        }
    });
}

function deleteRole() {
    client.query('SELECT * FROM roles', (err, res) => {
        if (err) {
            console.error('Error fetching roles:', err);
        } else {
            const roles = res.rows.map(({ id, title }) => ({ name: title, value: id }));

            inquirer.prompt([
                {
                    name: 'roleId',
                    type: 'list',
                    message: 'Which role would you like to delete?',
                    choices: roles
                }
            ]).then((answer) => {
                const query = `DELETE FROM roles WHERE id = $1 RETURNING *`;
                client.query(query, [answer.roleId], (err, res) => {
                    if (err) {
                        console.error('Error deleting role:', err);
                    } else {
                        console.log(`Role deleted:`, res.rows[0]);
                    }
                    promptUser();
                });
            });
        }
    });
}

function deleteEmployee() {
    client.query('SELECT * FROM employees', (err, res) => {
        if (err) {
            console.error('Error fetching employees:', err);
        } else {
            const employees = res.rows.map(({ id, first_name, last_name }) => ({ name: `${first_name} ${last_name}`, value: id }));

            inquirer.prompt([
                {
                    name: 'employeeId',
                    type: 'list',
                    message: 'Which employee would you like to delete?',
                    choices: employees
                }
            ]).then((answer) => {
                const query = `DELETE FROM employees WHERE id = $1 RETURNING *`;
                client.query(query, [answer.employeeId], (err, res) => {
                    if (err) {
                        console.error('Error deleting employee:', err);
                    } else {
                        console.log(`Employee deleted:`, res.rows[0]);
                    }
                    promptUser();
                });
            });
        }
    });
}

function viewDepartmentBudget() {
    client.query('SELECT * FROM departments', (err, res) => {
        if (err) {
            console.error('Error fetching departments:', err);
        } else {
            const departments = res.rows.map(({ id, name }) => ({ name: name, value: id }));

            inquirer.prompt([
                {
                    name: 'departmentId',
                    type: 'list',
                    message: 'Which department\'s total budget would you like to view?',
                    choices: departments
                }
            ]).then((answer) => {
                const query = `
                    SELECT departments.name AS department, SUM(roles.salary) AS total_budget
                    FROM employees
                    JOIN roles ON employees.role_id = roles.id
                    JOIN departments ON roles.department_id = departments.id
                    WHERE departments.id = $1
                    GROUP BY departments.name;
                `;
                client.query(query, [answer.departmentId], (err, res) => {
                    if (err) {
                        console.error('Error calculating budget:', err);
                    } else {
                        console.table(res.rows);
                    }
                    promptUser();
                });
            });
        }
    });
}