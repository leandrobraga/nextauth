import { GetServerSideProps } from "next";


import { setupAPIClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
 
  return(
    <>
      <h1>Metricas</h1>
     
    </>
    
  );
}

export const getServerSideProps: GetServerSideProps = withSSRAuth(async (ctx) => {
  // Quando for usar dentro do server chamar a função para passar o contexto e não a instancia api.
  const apiClient = setupAPIClient(ctx);
  const response = await apiClient.get('/me');
  


  return {
    props: {}
  }
}, {
    permissions: ['metrics.list'],
    roles: ['administartor']
});