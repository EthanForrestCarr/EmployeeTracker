SELECT id, name
FROM departments;

SELECT roles.id, roles.title, departments.name AS department, roles.salary
FROM roles
JOIN departments ON roles.department_id = departments.id;

SELECT 
    employees.id, 
    employees.first_name, 
    employees.last_name, 
    roles.title AS role, 
    departments.name AS department, 
    roles.salary, 
    CONCAT(manager.first_name, ' ', manager.last_name) AS manager
FROM employees
JOIN roles ON employees.role_id = roles.id
JOIN departments ON roles.department_id = departments.id
LEFT JOIN employees AS manager ON employees.manager_id = manager.id;

INSERT INTO departments (name)
VALUES ($1);

INSERT INTO roles (title, salary, department_id)
VALUES ($1, $2, $3);

INSERT INTO employees (first_name, last_name, role_id, manager_id)
VALUES ($1, $2, $3, $4);

UPDATE employees
SET role_id = $1
WHERE id = $2;