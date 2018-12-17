import React from 'react';
import { ErrorList } from '../../components/error-list';

export interface SignUpViewProps {
  email: string;
  userName: string;
  password: string;
  setEmail: (value: string) => void;
  setUserName: (value: string) => void;
  setPassword: (value: string) => void;
  signUp: () => void;
  errors: Array<string>;
}

export function SignUpView(props: SignUpViewProps) {
  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">

          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign up</h1>
            <p className="text-xs-center">
              <a href="#/login">Have an account?</a>
            </p>

            <ErrorList errors={props.errors} />

            <form>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Your Name"
                  onChange={(e) => props.setUserName(e.currentTarget.value)}
                  value={props.userName}
                />
              </fieldset>
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
              <button
                className="btn btn-lg btn-primary pull-xs-right"
                onClick={props.signUp}
              >
                Sign up
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
