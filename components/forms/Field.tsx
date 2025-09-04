import { Controller } from 'react-hook-form';
import Checkbox from '../inputs/Checkbox';
import DatePicker from '../inputs/DatePicker';
import Input from '../inputs/Input';
import MultiCheckbox from '../inputs/MultiCheckbox';
import MultiCheckboxNum from '../inputs/MultiCheckboxNum';
import RadioButtons from '../inputs/RadioButtons';
import SimplePicker from '../inputs/SimplePicker';
import StyledText from '../styledText';


export default function Field({ field, control }) {
    /*
    Component that builds a form input from a field. 
    - field (object): information to construct the input (see below)
    - control (RHF control): form controller
    */
    const { type, name, rules, label, placeholder, options,  labelField, valueField } = field;
    /*
    FIELD INFO:
    - type (string): what type of input this is, see the case switch below. 
    - name (string): name to use for the input
    - rules (object, optional): RHF validaiton rules
    - label (string): what text the user should see alongside the input
    - placeholder (string, optional): for text/numver inputs, what placeholder text to display when value is ''
    - options (array, optional): for picker/multiselect inputs, what options the user should see. Sent as an array of objects
    - labelField (string, optional): what object key to use as the label (default is 'label')
    - labelField (string, optional): what object key to use as the value (default is 'value')
    */
    return (
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({ field: controllerField, fieldState }) => {
                    const commonProps = {
                        ...controllerField,
                        label,
                        error: fieldState.error ? fieldState.error.message : null,
                    };

                    //return correct component based on the tyoe
                    switch (type) {
                    case "email-address":
                    case 'phone-pad':
                    case "numeric":
                    case "text":
                    case "textarea":
                        return <Input {...commonProps} keyboard={type} placeholder={placeholder} />
                    case 'date':
                        return <DatePicker {...commonProps} />  
                    case 'select': //single select, radio is preferred unless the options are many
                        return <SimplePicker options={options} {...commonProps} />;
                    
                    case "radio": //single select from list
                        return <RadioButtons options={options} {...commonProps} />;
                    case "checkbox": //toggle for true/false or switchpaths
                        return <Checkbox  {...commonProps} />;
                    case 'multiselect': //multiselect from checkbox
                        return <MultiCheckbox {...commonProps} options={options} valueField={valueField} labelField={labelField}/>
                    case 'multinumber': //really only useful for interaction subcategories that reuqire a number
                        return <MultiCheckboxNum {...commonProps} options={options} />
                        
                    default:
                        return <StyledText>Unsupported field type: {type}</StyledText>;
                    }
                }}
            />
        );
    }