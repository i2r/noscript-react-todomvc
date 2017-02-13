ns.log.exception = console.log;

ns.router.baseDir = '/';
ns.router.routes = {
    route: {
        '{filter:id=all}': 'app'
    }
};

ns.layout.define('app', {
    app: {
        'appBox@': {
            patchedWrapper: {
                'patchedView': true
            }
        }
    }
});

ns.View.define('app');
ns.View.define('patchedWrapper');

ns.ViewReact.define('patchedView', {
    methods: {
        patchLayout() {
            return 'patched';
        }
    }
});

ns.layout.define('patched', {
    'patchedViewBox@': {
        'patchedViewContent&': {
            'patchedSubview': true
        }
    }
});

const SubComponent = React.createClass({
    componentDidMount() {
        console.log('MOUNT SUBCOMPONENT');
    },
    render() {
        return <div>SUBCOMPONENT</div>;
    }
});

ns.ViewReact.define('patchedViewContent', {
    models: ['patchedModel'],
    events: {
        'ns-view-init': () => {
            console.log('INIT VIEW');
        },
        'ns-view-htmlinit': () => {
            console.log('HTMLINIT VIEW');
        },
        'ns-view-show': () => {
            console.log('SHOW VIEW');
        }
    },
    component: {
        componentDidMount() {
            console.log('MOUNT VIEW');
        },
        render() {
            if (this.props.view.isLoading()) {
                return (
                    <div className="patched-view-loading">
                        LOADING VIEW'S MODEL
                    </div>
                );
            }

            return (
                <div className="patched-view">
                    <div className="patched-view-child">
                        VIEW →
                    </div>
                    {this.createChildren()}
                </div>
            );
        }
    }
});

ns.Model.define('patchedModel', {
    methods: {
        request() {
            this.setData({ loaded: true });
            return Vow.fulfill({});
        }
    }
});

ns.ViewReact.define('patchedSubview', {
    events: {
        'ns-view-init': () => {
            console.log('INIT SUB');
        },
        'ns-view-htmlinit': () => {
            console.log('HTMLINIT SUB');
        },
        'ns-view-show': () => {
            console.log('SHOW SUB');
        }
    },
    component: {
        componentDidMount() {
            console.log('MOUNT SUBVIEW');
        },
        render() {
            if (this.props.view.isLoading()) {
                return (
                    <div className="patched-subview-loading">
                        LOADING SUB'S MODEL
                    </div>
                );
            }

            return (
                <div className="patched-subview">
                    SUBVIEW
                    <SubComponent/>
                </div>
            );
        }
    }
});

ns.page.title = no.nop;

ns.init();
ns.page.go();
