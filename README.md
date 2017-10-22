# postgres-driver
pg-promise sugar using proper types for easy (async) crud-commands. Add custom methods.

## Installation
this module is not listed on npm though it can be installed using it:
```shell
npm install git+https://github.com/jakoblorz/postgres-driver.git --save
```

## Usage
To use the methods, just create a new set class which is extending
the exported database class:
```typescript

// import the module
import { Database } from "postgres-driver";

// define a table definition (this is a
// IAccount interface where each key can be undefined)
interface IAccountTableDefinition {
    id?: string;
    name?: string;
    age?: number;
}

// actual account interface
interface IAccount extends IAccountTableDefinition {
    id: string;
    name: string;
    age: number;
}

// create a set class
class AccountSet extends Database<IAccountTableDefinition, "accounts"> {
    constructor(){
        super("postgres://user:password@host:port/database");
    }

    // define a custom method though this example
    // could be done using the createResource method
    public async createNewAccount(name: string) {

        // get the database interface - this is a pg-promise
        // database object
        const connection = await this.connect();

        // insert the dataset
        await connection.none(
            "INSERT INTO accounts (id, name, age) VALUES ($1, $2, $3)", [0, name, 18]);
    }
}

// use the class
const accounts = new AccountSet();

// invoke the read resource method
accounts.readResource<IAccount, { id: number }>("accounts", { id: 0 })
    .then((account: IAccount | null) => console.log(account === null ? 
        "" : JSON.stringify(account))); // { id: 0, name: "name", age: 18 }

// invoke a custom method
accounts.createNewAccount("user")
    .then(() => accounts.readResource<IAccount, { name: string }>("accounts", { name: "user" }))
    .then((res) => console.log(account === null ?
        "" : JSON.stringify(account))) // { id: 0, name: "user", age: 18 }
    .catch(console.error);
```

## Documentation
| method | description |
| --- | --- |
| `async` **`readResource`**`<X, Y>(relation: string, where: Y, select?: (keyof X)[] | keyof X | "*")` | read a single tuple from the relation - returning null if no row was found |
| `async` **`readResourceList`**`<X, Y>(relation: string, where: Y, select?: (keyof X)[] | keyof X | "*", skip?: number, limit?: number, orderByAsc?: (keyof X)[] | keyof X | "", orderByDsc?: (keyof X)[] | keyof X | "")` | read multiple tuples from the relation |
| `async` **`createResource`**`<X>(relation: string, tuple: X)`| insert a new tuple in the relation |
| `async` **`updateResource`**`<X, Y>(relation: string, update: X, where: Y)` | update one (multiple) tuple(s) in the relation |
| `async` **`deleteResource`**`<X>(relation: string, where: X)`| remove one (multiple) tuple(s) |
| `async` **`connect()`** | obtain the pg-promise database interface with an established connection to execute custom queries |