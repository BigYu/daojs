import React from 'react';
import { Layout, Input, Modal, Button } from 'antd';
import 'antd/dist/antd.css';
import StoryEditor from './story-editor';
import DashboardFrame from './dashboard-frame';
import './style/dashboard-frame.css';

const { Header, Content } = Layout;

const contentStyle = {
  background: '#f0f2f5',
  padding: 24,
};

export default class DashboardFrameEditor extends React.Component {
  constructor(props) {
    super(props);
    const { config: { logoImage, logo = logoImage, name, story } } = props;
    this.state = {
      logo,
      title: name,
      story,
      isPreviewing: false,
    };
  }

  preview() {
    const {
      title,
      logo,
      story,
    } = this.state;
    return (
      <Modal
        title="Preview"
        visible={this.state.isPreviewing}
        destroyOnClose
        width="100%"
        footer={null}
        onCancel={() => this.setState({ isPreviewing: false })}
      >
        <DashboardFrame
          title={title}
          logo={logo}
          story={story}
        />
      </Modal>
    );
  }

  render() {
    return (
      <Layout>
        <Header
          style={{
            paddingTop: '15px',
            background: 'transparent',
          }}
        >
          <Button
            type="primary"
            onClick={() => this.setState({ isPreviewing: true })}
          >
            Preview
          </Button>
        </Header>
        <Content>
          <Layout className="dao-dashboard-frame">
            <Header className="header dashboard-header">
              <div style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                height: '100%',
                width: '100px',
                backgroundImage: `url(${this.state.logo})`,
                backgroundPosition: 'center',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
              }}
              />
              <h3 style={{
                display: 'inline-block',
                verticalAlign: 'middle',
                color: 'gray',
                fontFamily: '微软雅黑',
              }}
              >
                <Input
                  placeholder="please input title"
                  value={this.state.title}
                  onChange={event => this.setState({ title: event.target.value })}
                />
              </h3>
            </Header>
            <Content style={contentStyle}>
              <StoryEditor
                value={this.state.story}
                onChange={val => this.setState({ story: val })}
              />
            </Content>
          </Layout>
          {this.preview()}
        </Content>
      </Layout>
    );
  }
}
