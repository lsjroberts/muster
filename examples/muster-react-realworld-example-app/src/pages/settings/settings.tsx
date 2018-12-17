import React from 'react';
import { ErrorList } from '../../components/error-list';

export interface SettingsViewProps {
  bio: string | undefined;
  email: string;
  image: string | undefined;
  username: string;
  password: string;
  setBio: (value: string) => void;
  setEmail: (value: string) => void;
  setImage: (value: string) => void;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  updateSettings: () => void;
  errors: Array<string>;
  logout: () => void;
}

export function SettingsView(props: SettingsViewProps) {
  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">

          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>

            <ErrorList errors={props.errors} />

            <form>
              <fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    placeholder="URL of profile picture"
                    onChange={(e) => props.setImage(e.currentTarget.value)}
                    value={props.image || ''}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Your Name"
                    onChange={(e) => props.setUsername(e.currentTarget.value)}
                    value={props.username || ''}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control form-control-lg"
                    rows={8}
                    placeholder="Short bio about you"
                    onChange={(e) => props.setBio(e.currentTarget.value)}
                    value={props.bio || ''}
                  ></textarea>
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    placeholder="Email"
                    onChange={(e) => props.setEmail(e.currentTarget.value)}
                    value={props.email || ''}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="password"
                    placeholder="Password"
                    onChange={(e) => props.setPassword(e.currentTarget.value)}
                    value={props.password || ''}
                  />
                </fieldset>
                <button
                  className="btn btn-lg btn-primary pull-xs-right"
                  onClick={props.updateSettings}
                >
                  Update Settings
                </button>
              </fieldset>
            </form>

            <hr />

            <button className="btn btn-outline-danger" onClick={props.logout}>
              Or click here to logout.
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
