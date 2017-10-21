import * as pgpromise from "pg-promise";

let postgres: pgpromise.IDatabase<any> | undefined;

/**
 * Database is a class to hold all the necessary methods
 */
export class Database<T extends {}> {

    /**
     * create a new database instance
     * @param url connection string to the database
     * @param options init options for the pg-promise engine
     */
    constructor(private url: string, private options?: pgpromise.IOptions<any>) { }

    /**
     * obtain a database interface to execute queries
     */
    private async connect() {

        // postgres object could not have been initialized yet
        if (postgres === undefined) {
            postgres = pgpromise(this.options)(this.url);
        }

        // return the postgres object
        return postgres;
    }
}
