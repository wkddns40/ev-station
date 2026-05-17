type PublishingPageProps = {
  showChart: boolean;
  charger_name: string | null;
  charger_id: string | null;
  mnfacr_name: string | null;
  model_name: string | null;
};

const PublishingPage = ({ showChart, charger_name, charger_id, mnfacr_name, model_name }: PublishingPageProps) => (
  <div>
    <h2 style={{ color: 'white' }}>Charging Station</h2>
    {showChart && (
      <>
        <p style={{ color: 'white' }}>{charger_name}</p>
        <p style={{ color: 'white' }}>{charger_id}</p>
        <p style={{ color: 'white' }}>{mnfacr_name}/{model_name}</p>
      </>
    )}
  </div>
);

export default PublishingPage;
