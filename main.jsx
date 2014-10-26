/** @jsx React.DOM */

var App = React.createClass({
    getInitialState: function() {
        return {
            stocks: [],
            currentPage: 'home'
        };
    },
    componentDidMount: function() {
        $.get('/watchlist.json', function(data) {
            if (this.isMounted()) {
                this.setState({
                    stocks: data
                });
            }
        }.bind(this));
    },
    handleNavigation: function(command) {
        if (command === 'show-home') {
            this.setState({currentPage: 'home'});
        } else if (command === 'show-stock') {
            this.setState({currentPage: 'stock'});
        } else {
            throw new Error('Unrecognised command: ' + command);
        }
    },
    getCurrentPage: function() {
        if (this.state.currentPage === 'home') {
            return <Home stocks={this.state.stocks} />;
        } else {
            return <Stock />
        }
    },
    render: function() {
        return (
            <div>
                <header>
                    <Nav handleNavigation={this.handleNavigation} currentPage={this.state.currentPage} />
                </header>
                <section>
                    {this.getCurrentPage()}
                </section>
                <footer>Footer</footer>
            </div>
        );
    }
});

var Stock = React.createClass({
    render: function() {
        return (
            <p>Stock here</p>
        )
    }
});

var Nav = React.createClass({
    handleClick: function(e) {
        e.preventDefault();
        this.props.handleNavigation($(e.target).data('command'));
    },
    render: function() {
        var currentPage = this.props.currentPage;
        return (
            <nav>
                <a onClick={this.handleClick} className={currentPage === 'home' ? 'current' : ''} data-command="show-home" href="/">Home</a>
                <a onClick={this.handleClick} className={currentPage === 'stock' ? 'current' : ''} data-command="show-stock" data-stock-id="5" href="/stock/5">Stock</a>
                <a onClick={this.handleClick} data-command="logout" href="#">Log out</a>
            </nav>
        );
    }
});

var Home = React.createClass({
    render: function() {
        return (
            <div>
                <p>This is the home template.</p>
                <Watchlist stocks={this.props.stocks}/>
            </div>
        );
    }
});

var Watchlist = React.createClass({
    render: function() {
        var stockNodes = this.props.stocks.map(function(s) {
            return (
                <li key={s.symbol}>{s.symbol}: {s.name}</li>
            );
        });
        return (
            <div>
                <h2>Watchlist</h2>
                <ul>
                    {stockNodes}
                </ul>
            </div>
        )
    }
});

React.renderComponent(<App />, $('#root')[0]);
