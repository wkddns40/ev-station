import SlidingPane from 'react-sliding-pane';

type RightPaneProps = {
  isOpen: boolean;
  handleClosePane: () => void;
};

const RightPane = ({ isOpen, handleClosePane }: RightPaneProps) => (
  <SlidingPane
    isOpen={isOpen}
    from="right"
    width="448px"
    className="right-pane"
    onRequestClose={handleClosePane}
  >
    <div style={{ marginTop: '250px', paddingLeft: '150px' }}>
      <h1>Graph</h1>
      <h1>Panel</h1>
    </div>
  </SlidingPane>
);

export default RightPane;
