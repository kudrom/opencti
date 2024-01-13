import { describe, expect, it } from 'vitest';
import gql from 'graphql-tag';
import { queryAsAdmin } from '../../utils/testQuery';

const LIST_QUERY = gql`
  query publicDashboards(
    $first: Int
    $after: ID
    $orderBy: PublicDashboardsOrdering
    $orderMode: OrderingMode
    $filters: FilterGroup
    $search: String
  ) {
      publicDashboards(
      first: $first
      after: $after
      orderBy: $orderBy
      orderMode: $orderMode
      filters: $filters
      search: $search
    ) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const READ_QUERY = gql`
  query PublicDashboard($id: String!) {
    publicDashboard(id: $id) {
      id
      name
    }
  }
`;

const CREATE_PRIVATE_DASHBOARD_QUERY = gql`
    mutation WorkspaceAdd($input: WorkspaceAddInput!) {
        workspaceAdd(input: $input) {
            id
            name
        }
    }
`;

const CREATE_QUERY = gql`
  mutation PublicDashboardAdd($input: PublicDashboardAddInput!) {
    publicDashboardAdd(input: $input) {
      id
      name
    }
  }
`;

const UPDATE_QUERY = gql`
  mutation PublicDashboardEdit($id: ID!, $input: [EditInput!]!) {
    publicDashboardFieldPatch(id: $id, input: $input) {
      id
      name
    }
  }
`;

const DELETE_QUERY = gql`
  mutation PublicDashboardDelete($id: ID!) {
    publicDashboardDelete(id: $id)
  }
`;

const DELETE_PRIVATE_DASHBOARD_QUERY = gql`
    mutation workspaceDelete($id: ID!) {
        workspaceDelete(id: $id)
    }
`;

describe('PublicDashboard resolver standard behavior', () => {
  let privateDashboardInternalId;
  let publicDashboardInternalId;
  const publicDashboardName = 'publicDashboard';
  it('should publicDashboard created', async () => {
    // Create Private dashboard
    const privateDashboard = await queryAsAdmin({
      query: CREATE_PRIVATE_DASHBOARD_QUERY,
      variables: {
        input: {
          type: 'dashboard',
          name: 'private dashboard',
        },
      },
    });
    privateDashboardInternalId = privateDashboard.data.workspaceAdd.id;
    // Create the publicDashboard
    const PUBLICDASHBOARD_TO_CREATE = {
      input: {
        name: publicDashboardName,
        description: 'publicDashboard description',
        dashboard_id: privateDashboardInternalId,
      },
    };
    const publicDashboard = await queryAsAdmin({
      query: CREATE_QUERY,
      variables: PUBLICDASHBOARD_TO_CREATE,
    });

    expect(publicDashboard.data.publicDashboardAdd).not.toBeNull();
    expect(publicDashboard.data.publicDashboardAdd.name).toEqual(publicDashboardName);
    publicDashboardInternalId = publicDashboard.data.publicDashboardAdd.id;
  });
  it('should publicDashboard loaded by internal id', async () => {
    const queryResult = await queryAsAdmin({
      query: READ_QUERY,
      variables: { id: publicDashboardInternalId },
    });
    expect(queryResult).not.toBeNull();
    expect(queryResult.data.publicDashboard).not.toBeNull();
    expect(queryResult.data.publicDashboard.id).toEqual(publicDashboardInternalId);
  });
  it('should list publicDashboards', async () => {
    const queryResult = await queryAsAdmin({
      query: LIST_QUERY,
      variables: { first: 10 },
    });
    expect(queryResult.data.publicDashboards.edges.length).toEqual(1);
  });
  it('should update publicDashboard', async () => {
    const updatedName = `${publicDashboardName} - updated`;
    const queryResult = await queryAsAdmin({
      query: UPDATE_QUERY,
      variables: {
        id: publicDashboardInternalId,
        input: { key: 'name', value: updatedName },
      },
    });
    expect(queryResult.data.publicDashboardFieldPatch.name).toEqual(updatedName);
  });
  it('should delete publicDashboard', async () => {
    // Delete the publicDashboard
    await queryAsAdmin({
      query: DELETE_QUERY,
      variables: { id: publicDashboardInternalId },
    });

    // Verify is no longer found
    const queryResult = await queryAsAdmin({
      query: LIST_QUERY,
      variables: { first: 10 },
    });
    expect(queryResult).not.toBeNull();
    expect(queryResult.data.publicDashboards.edges.length).toEqual(0);

    // Delete private dashboard
    await queryAsAdmin({
      query: DELETE_PRIVATE_DASHBOARD_QUERY,
      variables: { id: privateDashboardInternalId },
    });
  });
});
