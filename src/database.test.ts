import * as assert from "assert";
import * as mocha from "mocha";

import { Database } from "./database";

const database = new Database<{ id?: number, name?: string, verified?: boolean }, "users">(
    "postgres://jakob:Gailbach@localhost:5432/postgres_driver");

describe("testing database.ts", () => {

    it("should create a tuple without any errors", async () => {
        await database.createResource("users", { id: 0, name: "foo bar", verified: false });
        await database.createResource("users", { id: 1, name: "bar baz", verified: false });
    });

    it("should find inserted tuple without any errors", async () => {
        const user = await database
            .readResource<{ id: number, name: string, verified: boolean}, { id: number }>(
                "users", { id: 0 });
        
        assert.equal(user.id, 0);
        assert.equal(user.name, "foo bar");
        assert.equal(user.verified, false);
    });

    it("should find inserted tuples as list without any errors", async () => {
        const users = await database
            .readResourceList<{ id: number, name: string, verified: boolean}, { verified: boolean }>(
                "users", { verified: false });

        assert.equal(users.length, 2);
        assert.equal(users[0].id, 0);
        assert.equal(users[0].name, "foo bar");
        assert.equal(users[0].verified, false);
        assert.equal(users[1].id, 1);
        assert.equal(users[1].name, "bar baz");
        assert.equal(users[1].verified, false);
    });

    it("should ORDER BY DESC when specifying as string literal", async () => {
        const users = await database
            .readResourceList<{ id: number }, { verified: boolean }>(
                "users", { verified: false }, "*", 0, 10, "", "id");

        assert.equal(users.length, 2);
        assert.equal(users[0].id, 1);
        assert.equal(users[1].id, 0);
    });

    it("should ORDER BY DESC when specifying as string array", async () => {
        const users = await database
            .readResourceList<{ id: number }, { verified: boolean }>(
                "users", { verified: false }, "*", 0, 10, "", ["id"]);
        assert.equal(users.length, 2);
        assert.equal(users[0].id, 1);
        assert.equal(users[1].id, 0);
    });

    it("should update tuple without any errors", async () => {
        await database.updateResource("users", { verified: true }, { id: 0 });
        const user = await database.readResource("users", { id: 0 }) as
            { id: number, name: string, verified: boolean};
        assert.equal(user.verified, true);
    });

    it("should delete single tuple without any errors", async () => {
        await database.deleteResource("users", { id: 1 });
        const user = await database.readResource("users", { id: 1 }) as
            { id: number, name: string, verified: boolean};
        assert.equal(user, null);
    });

    after(async () => {
        await database.deleteResource("users", { id: 0 });
    });
});
