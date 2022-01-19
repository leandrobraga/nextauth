import { GetServerSideProps } from "next";
import { useContext, useEffect } from "react";
import { Can } from "../components/Can";

import { AuthContext } from "../contexts/AuthContext";
import { useCan } from "../hooks/useCan";
import { setupAPIClient } from "../services/api";
import { api } from "../services/apiClient";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  const userCanSeeMetrics = useCan({
    permissions: ['metrics.list']
  });

  useEffect(() => {
    api.get('/me').then(response => {
      console.log(response.data, 'dashboard');
    }).catch(err => console.log(err));
    
  }, []);
  return(
    <>
      <h1>Dashboard - {user?.email}</h1>
      {/* {userCanSeeMetrics && <div>Métricas</div>} */}
      <Can permissions={['metrics.list']}>
        <div>Metricas</div>
      </Can>
    </>
    
  );
}

export const getServerSideProps: GetServerSideProps = withSSRAuth(async (ctx) => {
  // Quando for usar dentro do server chamar a função para passar o contexto e não a instancia api.
  const apiClient = setupAPIClient(ctx);
  const response = await apiClient.get('/me');
  console.log(response.data);
  return {
    props: {}
  }
});