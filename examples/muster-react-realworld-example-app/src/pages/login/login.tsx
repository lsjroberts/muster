import React from 'react';
import { ErrorList } from '../../components/error-list';

export interface LoginViewProps {
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  login: () => void;
  errors: Array<string>;
}

export function LoginView(props: LoginViewProps) {
  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">

          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Login</h1>

            <ErrorList errors={props.errors} />

            <form>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Email"
                  onChange={(e) => props.setEmail(e.currentTarget.value)}
                  value={props.email}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="password"
                  placeholder="Password"
                  onChange={(e) => props.setPassword(e.currentTarget.value)}
                  value={props.password}
                />
              </fieldset>
              <button className="btn btn-lg btn-primary pull-xs-right" onClick={props.login}>
                Login
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
