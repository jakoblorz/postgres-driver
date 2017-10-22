import * as pgpromise from "pg-promise";

let postgres: pgpromise.IDatabase<any> | undefined;

interface IClauseValueTuple {
    clause: string;
    values: any[];
}

interface ITupleUsingPointers extends IClauseValueTuple {
    pointers: string;
}

/**
 * Database is a class to hold all the necessary methods
 */
export class Database<TDefintion extends {}, TModel extends TDefintion> {

    /**
     * create a new database instance
     * @param name table name
     * @param url connection string to the database
     * @param options init options for the pg-promise engine
     */
    constructor(private name: string, private url: string, private options?: pgpromise.IOptions<any>) { }

    /**
     * read a single tuple from the database
     * @param where specify the constraints a tuple needs to fullfill to be selected
     * @param select specify the columns that should be returned - should be ALL and the
     * SAME as the keys defined in the X type
     */
    public async readResource<X extends TDefintion>(where: X) {
            
        // reduce the where clause into accessible structure
        const { clause, values } = await this.where<X>(where);

        // get the database interface
        const connection = await this.connect();

        // execute the query
        return await connection.oneOrNone(

            // SELECT a, b FROM relation WHERE a = $1;
            "SELECT * FROM " + this.name + " WHERE " + clause + " LIMIT 1"
        , values) as TModel | null || null;
    }

    /**
     * read multiple tuples from the database
     * @param where specify the constraints a tuple needs to fullfill to be selected
     * @param skip specify the tuples that should be skipped before selecting - NOTE: make
     * use of the orderByAsc/orderByDsc arguments to give sense to the expression 'skip the
     * first x tuples'
     * @param limit specify a maximum count of tuples returned
     * @param orderByAsc specify columns which should be ordered in ascending order
     * @param orderByDsc specify columns which should be ordered in descending order
     */
    public async readResourceList<X extends TDefintion>(
        where: X, skip: number = 0, limit: number = 10,
        orderByAsc: Array<keyof TModel> | keyof TModel | "" = "",
        orderByDsc: Array<keyof TModel> | keyof TModel | "" = "") {
            
            // reduce the where clause into accessible structure
            const { clause, values } = await this.where<X>(where);

            //  build ORDER BY data for ascending orders
            const ascending = typeof orderByAsc === "string" ? orderByAsc + " ASC " : (orderByAsc as string[])
                .reduce<string>((acc, val) => acc += val + " ASC, ", "").slice(0, -2);

            // build ORDER BY data for descending orders
            const descending = typeof orderByDsc === "string" ? orderByDsc + " DESC " : (orderByDsc as string[])
                .reduce<string>((acc, val) => acc += val + " DESC, ", "").slice(0, -2);

            // check if ORDER BY statement is wanted
            const useOrderBy = orderByAsc !== "" || orderByDsc !== "" || (orderByAsc !== "" && orderByDsc !== "");

            // get the database interface
            const connection = await this.connect();

            // build the query
            const query = 
                // SELECT a,b,c FROM relation WHERE a = $1
                "SELECT * FROM " + this.name + " WHERE " + clause +

                // ORDER BY a ASC, b DSC
                (useOrderBy ? " ORDER BY " : "") +
                // insert ASC statements, check if a comma is required at the end because there
                // will be DSC clauses
                (orderByAsc !== "" ? (orderByDsc !== "" ? ascending + ", " : ascending) : "") +
                (orderByDsc !== "" ? descending : "") +

                // OFFSET 10 LIMIT 10;
                (skip > 0 ? " OFFSET " + skip + " " : "") + (limit > 0 ? " LIMIT " + limit + " " : "");

            // execute the query
            return await connection.many(query, values) as TModel[] || [];
        }

    /**
     * insert a new tuple into the database
     * @param tuple specify the data to insert
     */
    public async createResource<X extends TDefintion>(tuple: X) {

        // reduce the tuple clause into accessible structure
        // tslint:disable-next-line:prefer-const
        let { clause, pointers, values } = Object.keys(tuple)
            .reduce<ITupleUsingPointers>((acc, key, index) => {
                    acc.values.push((tuple as any)[key]);
                    acc.clause += key + ", ";
                    acc.pointers += "$" + (index + 1) + ", ";
                    return acc;
            },  { clause: "", pointers: "", values: []});

        // remove the last commas
        clause = clause.slice(0, -2);
        pointers = pointers.slice(0, -2);

        // get the database interface
        const connection = await this.connect();

        // execute the query
        return await connection.none(

            // INSERT INTO relation (a, b) VALUES ($1, $2);
            "INSERT INTO " + this.name + " (" + clause + ") VALUES (" + pointers + ")"
        , values) as null || null;
    }

    /**
     * update one/multiple tuple/tuples in the database
     * @param update specify the data to manipulate
     * @param where specify the constraints a tuple needs to fullfill to be updated
     */
    public async updateResource<X extends TDefintion, Y extends TDefintion>(update: X, where: Y) {
            
        // reduce the update clause into accessible structure
        const set = await this.set<X>(update);

        // decoy ($x) literals need index shifting
        const updateIndexOffset = set.values.length;

        // reduce the where clause into accessible structure
        const { clause, values } = await this.where<Y>(where, updateIndexOffset);

        // concat the values array into the update values array
        Array.prototype.push.apply(set.values, values);

        // get the database interface
        const connection = await this.connect();

        // execute the query
        return await connection.none(

            // UPDATE relation SET a = $1 WHERE b = $2;
            "UPDATE " + this.name + " SET " + set.clause + " WHERE " + clause
        , set.values) as null || null;
    }

    /**
     * remove one/multiple tuple/tuples from the database
     * @param where specify the constraint a tuple needs to fullfill to be deleted
     */
    public async deleteResource<X extends TDefintion>(where: X) {
            
            // reduce the where clause into accessible structure
            const { clause, values } = await this.where<X>(where);

            // get the database interface
            const connection = await this.connect();

            // execute the query
            return await connection.none(

                // DELETE FROM relation WHERE a = $1;
                "DELETE FROM " + this.name + " WHERE " + clause
            , values) as null || null;
        }

    /**
     * obtain a database interface to execute queries
     */
    public async connect() {

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
