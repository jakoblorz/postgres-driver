import * as assert from "assert";
import * as mocha from "mocha";

import { Database } from "./database";

const postgresUrl = process.env.POSTGRES_URL ||
    "postgres://default:default@localhost:5432/postgres_driver";

interface ITestUserTableDefinition {
    id?: number;
    name?: string;
    verified?: boolean;
}

interface ITestUserTable extends ITestUserTableDefinition {
    id: number;
    name: string;
    verified: boolean;
}

const database = new Database<ITestUserTableDefinition, ITestUserTable>(
    "users", postgresUrl);

describe("testing database.ts", () => {

    it("should create a tuple without any errors", async () => {
        await database.createResource({ id: 0, name: "foo bar", verified: false });
        await database.createResource({ id: 1, name: "bar baz", verified: false });
    });

    it("should find inserted tuple without any errors", async () => {
        const user = await database.readResource({ id: 0 });
        
        if (user === null) {
            throw Error("database response is null");
        }
        
        assert.equal(user.id, 0);
        assert.equal(user.name, "foo bar");
        assert.equal(user.verified, false);
    });

    it("should find inserted tuples as list without any errors", async () => {
        const users = await database.readResourceList({ verified: false });

        assert.equal(users.length, 2);
        assert.equal(users[0].id, 0);
        assert.equal(users[0].name, "foo bar");
        assert.equal(users[0].verified, false);
        assert.equal(users[1].id, 1);
        assert.equal(users[1].name, "bar baz");
        assert.equal(users[1].verified, false);
    });

    it("should ORDER BY ASC when specifying as string literal", async () => {
        const users = await database.readResourceList(
            { verified: false }, 0, 10, "id");

        assert.equal(users.length, 2);
        assert.equal(users[0].id, 0);
        assert.equal(users[1].id, 1);
    });

    it("should ORDER BY ASC when specifying as string array", async () => {
        const users = await database.readResourceList(
            { verified: false }, 0, 10, ["id"]);

        assert.equal(users.length, 2);
        assert.equal(users[0].id, 0);
        assert.equal(users[1].id, 1);
    });

    it("should ORDER BY DESC when specifying as string literal", async () => {
        const users = await database.readResourceList(
            { verified: false }, 0, 10, "", "id");

        assert.equal(users.length, 2);
        assert.equal(users[0].id, 1);
        assert.equal(users[1].id, 0);
    });

    it("should ORDER BY DESC when specifying as string array", async () => {
        const users = await database.readResourceList(
            { verified: false }, 0, 10, "", ["id"]);

        assert.equal(users.length, 2);
        assert.equal(users[0].id, 1);
        assert.equal(users[1].id, 0);
    });

    it("should update tuple without any errors", async () => {
        await database.updateResource({ verified: true }, { id: 0 });
        const user = await database.readResource({ id: 0 });

        if (user === null) {
            throw Error("database response is null");
        }

        assert.equal(user.verified, true);
    });

    it("should delete single tuple without any errors", async () => {
        await database.deleteResource({ id: 1 });
        const user = await database.readResource({ id: 1 });

        assert.equal(user, null);
    });

    after(async () => {
        await database.deleteResource({ id: 0 });
    });
});
