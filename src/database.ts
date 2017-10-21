import * as pgpromise from "pg-promise";

let postgres: pgpromise.IDatabase<any> | undefined;

interface IClauseValueTuple {
    clause: string;
    values: any[];
}

/**
 * Database is a class to hold all the necessary methods
 */
export class Database<T extends {}, R extends string> {

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

    /**
     * reduce a select object into a where clause
     * @param selection value object where the keys are the columns compare with the values
     * @param offset initialize the decoy ($x) literal with an offset
     */
    private async where<Y>(selection: Y, offset: number = 0) {
        
        // reduce object to clause-values data structure
        const where = Object.keys(selection).reduce<IClauseValueTuple>((acc, key, i) => {
            acc.values.push((selection as any)[key]);
            acc.clause += key + " = $" + (i + 1 + offset) + " AND ";
            return acc;
        }, { clause: "", values: [] });

        // remove the last AND off the clause
        where.clause = where.clause.slice(0, -5);

        return where;
    }

    /**
     * reduce an update object into a set clause
     * @param update value object where the keys are the columns to update and the values
     * are the values to insert
     * @param offset initialize the decoy ($x) literal with an offset
     */
    private async set<Y>(update: Y, offset: number = 0) {

        // reduce object to clause-values data structure
        const set = Object.keys(update).reduce<IClauseValueTuple>((acc, key, i) => {
            acc.values.push((update as any)[key]);
            acc.clause += key + " = $" + (i + 1 + offset) + ", ";
            return acc;
        }, { clause: "", values: [] });

        // remove the last space and comma of the clause string
        set.clause = set.clause.slice(0, -2);

        return set;
    }
}

const db = new Database<{ id?: string }, "accounts" | "users">("");
