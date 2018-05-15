export default `

  type User {
    id: Int!
    # name of the user, 3-18 length
    username: String!
    # phone of the user, unique
    phoneNumber: String!
    # email of the user, unique
    email: String!
    # gender of the user, like old field sex 1: man, 2: women
    gender: Int!
    # the teams that the user joined
    teams: [Team!]!
    # gender of the user, 1: man, 2: women
    sex: Int! @deprecated(reason: "Use gender instead.")
  }

  type Query {
    # get a user by id
    user(id: Int!): User
    # get all users
    users: [User!]!
  }

  type RegisterResponse {
    ok: Boolean!
    user: User
    errors: [Error!]
  }

  type LoginResponse {
    ok: Boolean!
    token: String
    refreshToken: String
    errors: [Error!]
  }

  type Mutation {
    register(username: String!, phoneNumber: String! email: String!, password: String!): RegisterResponse!
    login(email: String!, password: String!): LoginResponse!
  }

`;
