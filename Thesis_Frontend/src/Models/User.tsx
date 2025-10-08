class User {
    /**
     * Shortened version of the actual user model
     * The frontend app shouldn't have all the information that the database
     * and backend does, such as the password or DB id.
     * @class User
     *
     * @property {string} username - User's username
     * @property {string} email - User's email
     * @property {string} token - JWT session token. Implementing this into the UserModel might not be the best idea, but it simplifies the development process.
     */
    id: number;
    username: string;
    email: string;
    token: string;

    constructor(id: number, username: string, email: string, token: string,) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.token = token;
    }
}

export default User;