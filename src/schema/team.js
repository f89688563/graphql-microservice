export default `
  type Team {
    id: Int!
    # name of the team
    name: String!
    # users in the team
    users: [User!]!
    # the administrator of the team or not
    admin: Boolean!
    created_at: String!
  }

  type CreateTeamResponse {
    ok: Boolean!
    team: Team
    errors: [Error!]
  }

  type Query {
    allTeams: [Team!]!
    getTeamMembers(teamId: Int!): [User!]!
  }

  type Mutation {
    addTeam(name: String!): CreateTeamResponse!
  }
  
  type Subscription {
    newTeamMessage(name: String!): Team!
  }
`;
